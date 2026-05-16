<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GradeLevelSubject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class GradeLevelSubjectWeightController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $data = $this->validatePayload($request);

        $row = GradeLevelSubject::query()
            ->with(['gradeLevel:id,name', 'subject:id,name'])
            ->where('grade_level_id', $data['grade_level_id'])
            ->where('subject_id', $data['subject_id'])
            ->first();

        return response()->json(['data' => $this->present($row)]);
    }

    public function upsert(Request $request): JsonResponse
    {
        $data = $this->validatePayload($request, true);

        $row = GradeLevelSubject::updateOrCreate(
            [
                'grade_level_id' => $data['grade_level_id'],
                'subject_id' => $data['subject_id'],
            ],
            [
                'written_work_weight' => $data['written_work_weight'],
                'performance_task_weight' => $data['performance_task_weight'],
                'quarterly_assessment_weight' => $data['quarterly_assessment_weight'],
            ],
        )->load(['gradeLevel:id,name', 'subject:id,name']);

        return response()->json(['data' => $this->present($row)]);
    }

    private function validatePayload(Request $request, bool $requireWeights = false): array
    {
        $payload = Validator::make($request->all(), [
            'grade_level_id' => ['required', 'integer', 'exists:grade_levels,id'],
            'subject_id' => ['required', 'integer', 'exists:subjects,id'],
            'written_work_weight' => [$requireWeights ? 'required' : 'sometimes', 'numeric', 'min:0', 'max:100'],
            'performance_task_weight' => [$requireWeights ? 'required' : 'sometimes', 'numeric', 'min:0', 'max:100'],
            'quarterly_assessment_weight' => [$requireWeights ? 'required' : 'sometimes', 'numeric', 'min:0', 'max:100'],
        ])->validate();

        if ($requireWeights) {
            $total = (float) $payload['written_work_weight']
                + (float) $payload['performance_task_weight']
                + (float) $payload['quarterly_assessment_weight'];

            if (round($total, 2) !== 100.00) {
                abort(422, 'The grading weights must total 100%.');
            }
        }

        return $payload;
    }

    private function present(?GradeLevelSubject $row): ?array
    {
        if (! $row) {
            return null;
        }

        return [
            'id' => $row->id,
            'grade_level_id' => $row->grade_level_id,
            'grade_level_name' => $row->gradeLevel?->name,
            'subject_id' => $row->subject_id,
            'subject_name' => $row->subject?->name,
            'written_work_weight' => (float) $row->written_work_weight,
            'performance_task_weight' => (float) $row->performance_task_weight,
            'quarterly_assessment_weight' => (float) $row->quarterly_assessment_weight,
        ];
    }
}