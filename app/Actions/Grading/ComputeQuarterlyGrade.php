<?php

namespace App\Actions\Grading;

use App\Models\AssessmentComponent;
use App\Models\Enrollment;
use App\Models\GradeLevelSubject;
use App\Models\StudentGrade;
use Illuminate\Support\Facades\DB;

/**
 * Computes the DepEd K-12 quarterly grade for a single
 * (enrollment_id, subject_id, quarter_id) tuple from the related
 * `assessment_components` rows.
 *
 * Formula:
 *   PS_component = (sum_of_scores / sum_of_highest_possible_scores) * 100
 *   WS_component = PS_component * weight%
 *   InitialGrade = WW_WS + PT_WS + QA_WS
 *   QuarterlyGrade = transmute(InitialGrade)
 */
class ComputeQuarterlyGrade
{
    private const COMPONENT_TYPES = ['written_work', 'performance_task', 'quarterly_assessment'];

    /**
     * @return array{written_work_ps: float|null, performance_task_ps: float|null, quarterly_assessment_ps: float|null, quarterly_grade: float|null, initial_grade: float|null, remarks: string|null}
     */
    public function execute(int $enrollmentId, int $subjectId, int $quarterId, ?int $userId = null): array
    {
        $enrollment = Enrollment::with('gradeLevel')->findOrFail($enrollmentId);

        $weights = $this->resolveWeights($enrollment->grade_level_id, $subjectId);

        $components = AssessmentComponent::query()
            ->where('enrollment_id', $enrollmentId)
            ->where('subject_id', $subjectId)
            ->where('quarter_id', $quarterId)
            ->get();

        $ps = [
            'written_work' => $this->percentageScore($components, 'written_work'),
            'performance_task' => $this->percentageScore($components, 'performance_task'),
            'quarterly_assessment' => $this->percentageScore($components, 'quarterly_assessment'),
        ];

        $hasAny = collect($ps)->contains(fn ($v) => $v !== null);
        $initial = null;
        $quarterly = null;
        $remarks = null;
        if ($hasAny) {
            $initial = ($ps['written_work'] ?? 0) * ($weights['written_work_weight'] / 100)
                + ($ps['performance_task'] ?? 0) * ($weights['performance_task_weight'] / 100)
                + ($ps['quarterly_assessment'] ?? 0) * ($weights['quarterly_assessment_weight'] / 100);
            $quarterly = $this->transmute($initial);
            $remarks = $quarterly >= 75 ? 'Passed' : 'Failed';
        }

        DB::transaction(function () use ($enrollmentId, $subjectId, $quarterId, $ps, $quarterly, $remarks, $userId) {
            StudentGrade::updateOrCreate(
                [
                    'enrollment_id' => $enrollmentId,
                    'subject_id' => $subjectId,
                    'quarter_id' => $quarterId,
                ],
                [
                    'written_work_ps' => $ps['written_work'],
                    'performance_task_ps' => $ps['performance_task'],
                    'quarterly_assessment_ps' => $ps['quarterly_assessment'],
                    'quarterly_grade' => $quarterly,
                    'remarks' => $remarks,
                    'encoded_by' => $userId,
                ],
            );
        });

        return [
            'written_work_ps' => $ps['written_work'],
            'performance_task_ps' => $ps['performance_task'],
            'quarterly_assessment_ps' => $ps['quarterly_assessment'],
            'initial_grade' => $initial,
            'quarterly_grade' => $quarterly,
            'remarks' => $remarks,
        ];
    }

    public function recomputeFinal(int $enrollmentId, int $subjectId, ?int $userId = null): ?float
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

    private function percentageScore($components, string $type): ?float
    {
        $rows = $components->where('component_type', $type);
        if ($rows->isEmpty()) {
            return null;
        }

        $sumScore = (float) $rows->sum('score');
        $sumMax = (float) $rows->sum('highest_possible_score');
        if ($sumMax <= 0) {
            return null;
        }

        return round(($sumScore / $sumMax) * 100, 2);
    }

    private function resolveWeights(int $gradeLevelId, int $subjectId): array
    {
        $row = GradeLevelSubject::where('grade_level_id', $gradeLevelId)
            ->where('subject_id', $subjectId)
            ->first();

        if ($row) {
            return [
                'written_work_weight' => (float) $row->written_work_weight,
                'performance_task_weight' => (float) $row->performance_task_weight,
                'quarterly_assessment_weight' => (float) $row->quarterly_assessment_weight,
            ];
        }

        return [
            'written_work_weight' => 30.0,
            'performance_task_weight' => 50.0,
            'quarterly_assessment_weight' => 20.0,
        ];
    }

    private function transmute(float $initial): float
    {
        $table = [
            [100, 100, 100],
            [98.40, 99.99, 99],
            [96.80, 98.39, 98],
            [95.20, 96.79, 97],
            [93.60, 95.19, 96],
            [92.00, 93.59, 95],
            [90.40, 91.99, 94],
            [88.80, 90.39, 93],
            [87.20, 88.79, 92],
            [85.60, 87.19, 91],
            [84.00, 85.59, 90],
            [82.40, 83.99, 89],
            [80.80, 82.39, 88],
            [79.20, 80.79, 87],
            [77.60, 79.19, 86],
            [76.00, 77.59, 85],
            [74.40, 75.99, 84],
            [72.80, 74.39, 83],
            [71.20, 72.79, 82],
            [69.60, 71.19, 81],
            [68.00, 69.59, 80],
            [66.40, 67.99, 79],
            [64.80, 66.39, 78],
            [63.20, 64.79, 77],
            [61.60, 63.19, 76],
            [60.00, 61.59, 75],
            [56.00, 59.99, 74],
            [52.00, 55.99, 73],
            [48.00, 51.99, 72],
            [44.00, 47.99, 71],
            [40.00, 43.99, 70],
            [36.00, 39.99, 69],
            [32.00, 35.99, 68],
            [28.00, 31.99, 67],
            [24.00, 27.99, 66],
            [20.00, 23.99, 65],
            [16.00, 19.99, 64],
            [12.00, 15.99, 63],
            [8.00, 11.99, 62],
            [4.00, 7.99, 61],
            [0, 3.99, 60],
        ];

        foreach ($table as [$min, $max, $grade]) {
            if ($initial >= $min && $initial <= $max) {
                return (float) $grade;
            }
        }

        return $initial >= 100 ? 100.0 : 60.0;
    }
}
