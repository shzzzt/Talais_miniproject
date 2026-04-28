<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\CheckAbsenceThreshold;
use App\Models\AttendanceRecord;
use App\Models\Enrollment;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class AttendanceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AttendanceRecord::query()
            ->with(['enrollment.student:id,first_name,middle_name,last_name,lrn', 'enrollment.section:id,name,grade_level_id'])
            ->when($request->filled('student_id'), function ($q) use ($request) {
                $q->whereHas('enrollment', fn ($e) => $e->where('student_id', $request->integer('student_id')));
            })
            ->when($request->filled('enrollment_id'), fn ($q) => $q->where('enrollment_id', $request->integer('enrollment_id')))
            ->when($request->filled('section_id'), function ($q) use ($request) {
                $q->whereHas('enrollment', fn ($e) => $e->where('section_id', $request->integer('section_id')));
            })
            ->when($request->filled('school_year_id'), function ($q) use ($request) {
                $q->whereHas('enrollment', fn ($e) => $e->where('school_year_id', $request->integer('school_year_id')));
            })
            ->when($request->filled('date'), fn ($q) => $q->whereDate('date', $request->date('date')))
            ->when($request->filled('from'), fn ($q) => $q->whereDate('date', '>=', $request->date('from')))
            ->when($request->filled('to'), fn ($q) => $q->whereDate('date', '<=', $request->date('to')))
            ->orderByDesc('date')
            ->limit((int) $request->query('limit', 1000));

        return response()->json(['data' => $query->get()->map(fn ($r) => $this->present($r))]);
    }

    public function show(string $id): JsonResponse
    {
        $record = AttendanceRecord::with(['enrollment.student', 'enrollment.section'])->findOrFail($id);
        return response()->json(['data' => $this->present($record)]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validatePayload($request);
        $enrollmentId = $data['enrollment_id'] ?? $this->resolveEnrollmentId($data);

        $record = AttendanceRecord::updateOrCreate(
            ['enrollment_id' => $enrollmentId, 'date' => $data['date']],
            [
                'am_status' => $data['am_status'] ?? null,
                'pm_status' => $data['pm_status'] ?? null,
                'remarks' => $data['remarks'] ?? null,
                'recorded_by' => $request->user()?->id,
            ],
        );

        $this->maybeDispatchAbsenceCheck($record);

        return response()->json(['data' => $this->present($record->fresh(['enrollment.student', 'enrollment.section']))], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $record = AttendanceRecord::findOrFail($id);
        $data = $this->validatePayload($request);

        $record->fill([
            'date' => $data['date'] ?? $record->date,
            'am_status' => $data['am_status'] ?? $record->am_status,
            'pm_status' => $data['pm_status'] ?? $record->pm_status,
            'remarks' => array_key_exists('remarks', $data) ? $data['remarks'] : $record->remarks,
            'recorded_by' => $request->user()?->id,
        ])->save();

        $this->maybeDispatchAbsenceCheck($record);

        return response()->json(['data' => $this->present($record->fresh(['enrollment.student', 'enrollment.section']))]);
    }

    public function destroy(string $id): JsonResponse
    {
        AttendanceRecord::findOrFail($id)->delete();
        return response()->json(['data' => true]);
    }

    /**
     * Bulk save: accepts an array of attendance rows for a single date and section.
     * Used by the section-based attendance sheet UI.
     */
    public function bulk(Request $request): JsonResponse
    {
        $payload = Validator::make($request->all(), [
            'date' => 'required|date',
            'section_id' => 'sometimes|integer|exists:sections,id',
            'records' => 'required|array',
            'records.*.enrollment_id' => 'sometimes|integer|exists:enrollments,id',
            'records.*.student_id' => 'sometimes|integer|exists:students,id',
            'records.*.am_status' => 'nullable|in:present,absent,late,excused',
            'records.*.pm_status' => 'nullable|in:present,absent,late,excused',
            'records.*.remarks' => 'nullable|string|max:255',
        ])->validate();

        $saved = DB::transaction(function () use ($payload, $request) {
            $rows = [];
            foreach ($payload['records'] as $row) {
                $enrollmentId = $row['enrollment_id'] ?? $this->resolveEnrollmentId($row);
                $record = AttendanceRecord::updateOrCreate(
                    ['enrollment_id' => $enrollmentId, 'date' => $payload['date']],
                    [
                        'am_status' => $row['am_status'] ?? null,
                        'pm_status' => $row['pm_status'] ?? null,
                        'remarks' => $row['remarks'] ?? null,
                        'recorded_by' => $request->user()?->id,
                    ],
                );
                $this->maybeDispatchAbsenceCheck($record);
                $rows[] = $record;
            }
            return $rows;
        });

        $records = collect($saved)->map(fn ($r) => $this->present($r->load(['enrollment.student', 'enrollment.section'])));

        return response()->json(['data' => $records]);
    }

    /**
     * Aggregated attendance summary per enrollment for a date range.
     */
    public function summary(Request $request): JsonResponse
    {
        $request->validate([
            'section_id' => 'sometimes|integer|exists:sections,id',
            'school_year_id' => 'sometimes|integer|exists:school_years,id',
            'student_id' => 'sometimes|integer|exists:students,id',
            'from' => 'sometimes|date',
            'to' => 'sometimes|date',
        ]);

        $query = AttendanceRecord::query()
            ->selectRaw('enrollment_id,
                count(*) as total_days,
                sum(case when am_status = \'present\' or pm_status = \'present\' then 1 else 0 end) as present_days,
                sum(case when am_status = \'absent\' or pm_status = \'absent\' then 1 else 0 end) as absent_days,
                sum(case when am_status = \'late\' or pm_status = \'late\' then 1 else 0 end) as late_days,
                sum(case when am_status = \'excused\' or pm_status = \'excused\' then 1 else 0 end) as excused_days')
            ->groupBy('enrollment_id')
            ->when($request->filled('from'), fn ($q) => $q->whereDate('date', '>=', $request->date('from')))
            ->when($request->filled('to'), fn ($q) => $q->whereDate('date', '<=', $request->date('to')))
            ->when($request->filled('student_id'), function ($q) use ($request) {
                $q->whereHas('enrollment', fn ($e) => $e->where('student_id', $request->integer('student_id')));
            })
            ->when($request->filled('section_id'), function ($q) use ($request) {
                $q->whereHas('enrollment', fn ($e) => $e->where('section_id', $request->integer('section_id')));
            })
            ->when($request->filled('school_year_id'), function ($q) use ($request) {
                $q->whereHas('enrollment', fn ($e) => $e->where('school_year_id', $request->integer('school_year_id')));
            });

        return response()->json(['data' => $query->get()]);
    }

    private function validatePayload(Request $request): array
    {
        return Validator::make($request->all(), [
            'enrollment_id' => 'sometimes|integer|exists:enrollments,id',
            'student_id' => 'sometimes|integer|exists:students,id',
            'date' => 'required|date',
            'am_status' => 'nullable|in:present,absent,late,excused',
            'pm_status' => 'nullable|in:present,absent,late,excused',
            'remarks' => 'nullable|string|max:255',
        ])->validate();
    }

    private function resolveEnrollmentId(array $payload): int
    {
        if (! isset($payload['student_id'])) {
            abort(422, 'Either enrollment_id or student_id is required.');
        }

        $student = Student::with('currentEnrollment')->findOrFail($payload['student_id']);
        $enrollment = $student->currentEnrollment;
        if (! $enrollment) {
            abort(422, 'Student has no active enrollment.');
        }

        return $enrollment->id;
    }

    private function maybeDispatchAbsenceCheck(AttendanceRecord $record): void
    {
        if ($record->am_status === 'absent' || $record->pm_status === 'absent') {
            CheckAbsenceThreshold::dispatch($record->enrollment_id);
        }
    }

    private function present(AttendanceRecord $record): array
    {
        $student = $record->enrollment?->student;
        return [
            'id' => $record->id,
            'enrollment_id' => $record->enrollment_id,
            'student_id' => $student?->id,
            'student_name' => $student
                ? trim(($student->last_name ?? '').', '.($student->first_name ?? ''))
                : null,
            'section_id' => $record->enrollment?->section_id,
            'section_name' => $record->enrollment?->section?->name,
            'date' => $record->date instanceof Carbon
                ? $record->date->toDateString()
                : (string) $record->date,
            'am_status' => $record->am_status,
            'pm_status' => $record->pm_status,
            'status' => $this->dayStatus($record),
            'remarks' => $record->remarks,
            'recorded_by' => $record->recorded_by,
            'updated_at' => $record->updated_at?->toIso8601String(),
        ];
    }

    private function dayStatus(AttendanceRecord $record): string
    {
        if ($record->am_status === 'absent' && $record->pm_status === 'absent') {
            return 'absent';
        }
        if ($record->am_status === 'absent' || $record->pm_status === 'absent') {
            return 'half_day';
        }
        if ($record->am_status === 'late' || $record->pm_status === 'late') {
            return 'late';
        }
        if ($record->am_status === 'excused' || $record->pm_status === 'excused') {
            return 'excused';
        }
        return 'present';
    }
}
