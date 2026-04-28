<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\Enrollment;
use App\Models\KeyPerformanceIndicator;
use App\Models\SchoolYear;
use App\Models\Student;
use App\Models\StudentGrade;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class KpiController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $records = KeyPerformanceIndicator::query()
            ->with(['gradeLevel:id,name', 'schoolYear:id,label'])
            ->when($request->filled('school_year_id'), fn ($q) => $q->where('school_year_id', $request->input('school_year_id')))
            ->when($request->filled('indicator_name'), fn ($q) => $q->where('indicator_name', $request->input('indicator_name')))
            ->orderByDesc('computed_at')
            ->limit(min((int) $request->query('limit', 200), 1000))
            ->get();

        return response()->json([
            'data' => $records->map(fn ($r) => $this->present($r))->values(),
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $record = KeyPerformanceIndicator::with(['gradeLevel', 'schoolYear'])->findOrFail($id);
        return response()->json(['data' => $this->present($record)]);
    }

    public function store(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'school_year_id' => ['nullable', 'integer', 'exists:school_years,id'],
            'indicator_name' => ['required', 'string', 'max:120'],
            'value' => ['required', 'numeric'],
            'formula_used' => ['nullable', 'string'],
            'grade_level_id' => ['nullable', 'integer', 'exists:grade_levels,id'],
        ]);

        $record = KeyPerformanceIndicator::create([
            'school_year_id' => $payload['school_year_id'] ?? SchoolYear::active()?->id,
            'indicator_name' => $payload['indicator_name'],
            'value' => $payload['value'],
            'formula_used' => $payload['formula_used'] ?? null,
            'grade_level_id' => $payload['grade_level_id'] ?? null,
            'computed_at' => now(),
            'computed_by' => $request->user()?->id,
        ]);

        $record->load(['gradeLevel', 'schoolYear']);
        return response()->json(['data' => $this->present($record)], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $record = KeyPerformanceIndicator::findOrFail($id);
        $payload = $request->validate([
            'indicator_name' => ['sometimes', 'string', 'max:120'],
            'value' => ['sometimes', 'numeric'],
            'formula_used' => ['nullable', 'string'],
        ]);
        $record->fill($payload)->save();
        $record->load(['gradeLevel', 'schoolYear']);
        return response()->json(['data' => $this->present($record)]);
    }

    public function destroy(string $id): JsonResponse
    {
        $record = KeyPerformanceIndicator::findOrFail($id);
        $record->delete();
        return response()->json(['data' => true]);
    }

    /**
     * Compute and persist the standard set of KPIs for a given (or active)
     * school year. Triggered manually by admins from AdminSettings.
     */
    public function compute(Request $request): JsonResponse
    {
        $year = $request->filled('school_year_id')
            ? SchoolYear::findOrFail($request->integer('school_year_id'))
            : SchoolYear::active();

        if (! $year) {
            return response()->json(['message' => 'No active school year.'], 422);
        }

        $userId = $request->user()?->id;
        $yearId = $year->id;

        return DB::transaction(function () use ($yearId, $userId) {
            $enrollmentsCount = Enrollment::where('school_year_id', $yearId)->count();
            $promoted = StudentGrade::query()
                ->whereHas('enrollment', fn ($q) => $q->where('school_year_id', $yearId))
                ->whereNotNull('final_grade')
                ->where('final_grade', '>=', 75)
                ->distinct('enrollment_id')
                ->count('enrollment_id');
            $retained = StudentGrade::query()
                ->whereHas('enrollment', fn ($q) => $q->where('school_year_id', $yearId))
                ->whereNotNull('final_grade')
                ->where('final_grade', '<', 75)
                ->distinct('enrollment_id')
                ->count('enrollment_id');

            $promotionRate = $enrollmentsCount ? round(($promoted / $enrollmentsCount) * 100, 2) : 0.0;
            $retentionRate = $enrollmentsCount ? round(($retained / $enrollmentsCount) * 100, 2) : 0.0;

            $totalSessions = AttendanceRecord::whereHas(
                'enrollment',
                fn ($q) => $q->where('school_year_id', $yearId)
            )->count();
            $absences = AttendanceRecord::whereHas('enrollment', fn ($q) => $q->where('school_year_id', $yearId))
                ->where(function ($q) {
                    $q->where('am_status', 'absent')->orWhere('pm_status', 'absent');
                })->count();
            $attendanceRate = $totalSessions ? round((($totalSessions - $absences) / $totalSessions) * 100, 2) : 0.0;

            $dropouts = Student::where('status', 'dropped')->count();
            $dropoutRate = $enrollmentsCount ? round(($dropouts / $enrollmentsCount) * 100, 2) : 0.0;

            $items = [
                ['Promotion Rate', $promotionRate, '(promoted_enrollments / total_enrollments) * 100'],
                ['Retention Rate', $retentionRate, '(retained_enrollments / total_enrollments) * 100'],
                ['Attendance Rate', $attendanceRate, '((sessions - absences) / sessions) * 100'],
                ['Dropout Rate', $dropoutRate, '(dropped_students / total_enrollments) * 100'],
            ];

            $written = [];
            foreach ($items as [$name, $value, $formula]) {
                $written[] = KeyPerformanceIndicator::updateOrCreate(
                    [
                        'school_year_id' => $yearId,
                        'indicator_name' => $name,
                        'grade_level_id' => null,
                    ],
                    [
                        'value' => $value,
                        'formula_used' => $formula,
                        'computed_at' => now(),
                        'computed_by' => $userId,
                    ],
                );
            }

            return response()->json([
                'data' => collect($written)->map(fn ($r) => $this->present($r->fresh(['gradeLevel', 'schoolYear'])))->values(),
                'meta' => [
                    'school_year_id' => $yearId,
                    'enrollments' => $enrollmentsCount,
                    'computed_at' => now()->toIso8601String(),
                ],
            ]);
        });
    }

    private function present(KeyPerformanceIndicator $record): array
    {
        return [
            'id' => $record->id,
            'school_year_id' => $record->school_year_id,
            'school_year' => $record->schoolYear?->label,
            'indicator_name' => $record->indicator_name,
            'metric' => $record->indicator_name,
            'value' => (float) $record->value,
            'formula_used' => $record->formula_used,
            'grade_level_id' => $record->grade_level_id,
            'grade_level' => $record->gradeLevel?->name,
            'computed_at' => $record->computed_at?->toIso8601String(),
            'computed_by' => $record->computed_by,
            'created_at' => $record->created_at?->toIso8601String(),
            'updated_at' => $record->updated_at?->toIso8601String(),
        ];
    }
}
