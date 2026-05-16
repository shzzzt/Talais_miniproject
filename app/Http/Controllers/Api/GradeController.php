<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\Quarter;
use App\Models\Student;
use App\Models\StudentGrade;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class GradeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = StudentGrade::query()
            ->with([
                'enrollment.student',
                'enrollment.section',
                'enrollment.gradeLevel',
                'subject',
                'quarter',
            ])
            ->when($request->filled('student_id'), function ($q) use ($request) {
                $q->whereHas('enrollment', fn ($e) => $e->where('student_id', $request->integer('student_id')));
            })
            ->when($request->filled('section_id'), function ($q) use ($request) {
                $q->whereHas('enrollment', fn ($e) => $e->where('section_id', $request->integer('section_id')));
            })
            ->when($request->filled('school_year_id'), function ($q) use ($request) {
                $q->whereHas('enrollment', fn ($e) => $e->where('school_year_id', $request->integer('school_year_id')));
            })
            ->when($request->filled('enrollment_id'), fn ($q) => $q->where('enrollment_id', $request->integer('enrollment_id')))
            ->when($request->filled('subject_id'), fn ($q) => $q->where('subject_id', $request->integer('subject_id')))
            ->when($request->filled('quarter_id'), fn ($q) => $q->where('quarter_id', $request->integer('quarter_id')))
            ->when($request->filled('quarter'), function ($q) use ($request) {
                $num = $this->quarterNumberFromLabel((string) $request->input('quarter'));
                if ($num) {
                    $q->whereHas('quarter', fn ($qq) => $qq->where('quarter_number', $num));
                }
            })
            ->orderByDesc('id')
            ->limit((int) $request->query('limit', 1000));

        return response()->json(['data' => $query->get()->map(fn ($row) => $this->present($row))]);
    }

    public function show(string $id): JsonResponse
    {
        $row = StudentGrade::with(['enrollment.student', 'enrollment.section', 'subject', 'quarter'])
            ->findOrFail($id);

        return response()->json(['data' => $this->present($row)]);
    }

    public function store(Request $request): JsonResponse
    {
        $payload = $this->validateGradePayload($request);

        $grade = DB::transaction(fn () => $this->upsertGrade($payload, $request->user()?->id));

        return response()->json(['data' => $this->present($grade)], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $existing = StudentGrade::findOrFail($id);
        if ($existing->is_locked && ! ($request->user()?->hasRole('admin') ?? false)) {
            return response()->json(['message' => 'This grade record is locked.'], 423);
        }

        $payload = $this->validateGradePayload($request);
        $payload['id'] = (int) $id;

        $grade = DB::transaction(fn () => $this->upsertGrade($payload, $request->user()?->id));

        return response()->json(['data' => $this->present($grade)]);
    }

    public function destroy(string $id): JsonResponse
    {
        $grade = StudentGrade::findOrFail($id);
        $grade->delete();

        return response()->json(['data' => true]);
    }

    private function validateGradePayload(Request $request): array
    {
        return Validator::make($request->all(), [
            'student_id' => 'sometimes|integer|exists:students,id',
            'enrollment_id' => 'sometimes|integer|exists:enrollments,id',
            'section_id' => 'sometimes|integer|exists:sections,id',
            'subject_id' => 'required|integer|exists:subjects,id',
            'quarter' => 'sometimes|string',
            'quarter_id' => 'sometimes|integer|exists:quarters,id',
            'quarterly_grade' => 'required_without:final_grade|numeric|min:0|max:100',
            'final_grade' => 'nullable|numeric|min:0|max:100',
            'is_locked' => 'sometimes|boolean',
            'remarks' => 'sometimes|string|max:32',
        ])->validate();
    }

    private function upsertGrade(array $payload, ?int $userId): StudentGrade
    {
        $enrollmentId = $payload['enrollment_id'] ?? $this->resolveEnrollmentId($payload);
        $quarterId = $payload['quarter_id'] ?? $this->resolveQuarterId($payload);

        $enrollment = Enrollment::with('schoolYear')->findOrFail($enrollmentId);
        $subjectId = (int) $payload['subject_id'];
        $gradeValue = array_key_exists('quarterly_grade', $payload)
            ? (float) $payload['quarterly_grade']
            : (float) $payload['final_grade'];

        $grade = StudentGrade::updateOrCreate(
            [
                'enrollment_id' => $enrollment->id,
                'subject_id' => $subjectId,
                'quarter_id' => $quarterId,
            ],
            [
                'quarterly_grade' => $gradeValue,
                'final_grade' => $gradeValue,
                'remarks' => $payload['remarks'] ?? ($gradeValue >= 75 ? 'Passed' : 'Failed'),
                'is_locked' => (bool) ($payload['is_locked'] ?? false),
                'encoded_by' => $userId,
            ],
        );

        $this->recomputeFinal($enrollment->id, $subjectId, $userId);

        return $grade->refresh()->load(['enrollment.student', 'enrollment.section', 'subject', 'quarter']);
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

    private function resolveQuarterId(array $payload): int
    {
        $label = $payload['quarter'] ?? null;
        $num = $this->quarterNumberFromLabel((string) $label);

        if (! $num) {
            abort(422, 'Quarter is required (Q1..Q4).');
        }

        $quarter = Quarter::query()->where('quarter_number', $num)->orderByDesc('id')->first();
        if (! $quarter) {
            abort(422, "Quarter Q{$num} is not configured.");
        }

        return $quarter->id;
    }

    private function quarterNumberFromLabel(string $label): ?int
    {
        $normalized = strtoupper(trim($label));
        return match ($normalized) {
            'Q1', '1', '1ST', 'FIRST' => 1,
            'Q2', '2', '2ND', 'SECOND' => 2,
            'Q3', '3', '3RD', 'THIRD' => 3,
            'Q4', '4', '4TH', 'FOURTH' => 4,
            default => null,
        };
    }

    private function present(StudentGrade $grade): array
    {
        $student = $grade->enrollment?->student;
        $subject = $grade->subject;
        $section = $grade->enrollment?->section;
        $quarter = $grade->quarter;

        return [
            'id' => $grade->id,
            'enrollment_id' => $grade->enrollment_id,
            'student_id' => $student?->id,
            'student_name' => $student
                ? trim(($student->last_name ?? '').', '.($student->first_name ?? ''))
                : null,
            'section_id' => $section?->id,
            'subject_id' => $grade->subject_id,
            'subject_name' => $subject?->name,
            'grade_level' => $grade->enrollment?->gradeLevel?->name,
            'quarter_id' => $grade->quarter_id,
            'quarter' => $quarter ? ('Q'.$quarter->quarter_number) : null,
            'quarterly_grade' => $grade->quarterly_grade,
            'final_grade' => $grade->final_grade,
            'remarks' => $grade->remarks,
            'is_locked' => $grade->is_locked,
            'validated_by' => $grade->validated_by,
            'validated_at' => $grade->validated_at?->toIso8601String(),
            'updated_at' => $grade->updated_at?->toIso8601String(),
        ];
    }

    private function recomputeFinal(int $enrollmentId, int $subjectId, ?int $userId = null): ?float
    {
        $grades = StudentGrade::where('enrollment_id', $enrollmentId)
            ->where('subject_id', $subjectId)
            ->whereNotNull('quarterly_grade')
            ->pluck('quarterly_grade');

        if ($grades->count() === 0) {
            return null;
        }

        $final = round($grades->avg(), 2);

        StudentGrade::where('enrollment_id', $enrollmentId)
            ->where('subject_id', $subjectId)
            ->update([
                'final_grade' => $final,
                'validated_by' => $userId,
                'validated_at' => now(),
            ]);

        return $final;
    }
}
