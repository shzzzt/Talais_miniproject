<?php

namespace App\Http\Controllers\Api;

use App\Actions\Grading\ComputeQuarterlyGrade;
use App\Http\Controllers\Controller;
use App\Models\AssessmentComponent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AssessmentComponentController extends Controller
{
    public function __construct(private readonly ComputeQuarterlyGrade $compute)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $query = AssessmentComponent::query()
            ->when($request->filled('enrollment_id'), fn ($q) => $q->where('enrollment_id', $request->integer('enrollment_id')))
            ->when($request->filled('subject_id'), fn ($q) => $q->where('subject_id', $request->integer('subject_id')))
            ->when($request->filled('quarter_id'), fn ($q) => $q->where('quarter_id', $request->integer('quarter_id')))
            ->when($request->filled('component_type'), fn ($q) => $q->where('component_type', $request->input('component_type')))
            ->orderBy('component_type')
            ->orderBy('item_number')
            ->limit((int) $request->query('limit', 1000));

        return response()->json(['data' => $query->get()]);
    }

    public function show(string $id): JsonResponse
    {
        return response()->json(['data' => AssessmentComponent::findOrFail($id)]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validatePayload($request);
        $data['encoded_by'] = $request->user()?->id;

        $component = AssessmentComponent::create($data);
        $this->compute->execute($component->enrollment_id, $component->subject_id, $component->quarter_id, $request->user()?->id);
        $this->compute->recomputeFinal($component->enrollment_id, $component->subject_id, $request->user()?->id);

        return response()->json(['data' => $component], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $component = AssessmentComponent::findOrFail($id);
        $data = $this->validatePayload($request);

        $component->fill($data)->save();
        $this->compute->execute($component->enrollment_id, $component->subject_id, $component->quarter_id, $request->user()?->id);
        $this->compute->recomputeFinal($component->enrollment_id, $component->subject_id, $request->user()?->id);

        return response()->json(['data' => $component]);
    }

    public function destroy(string $id): JsonResponse
    {
        $component = AssessmentComponent::findOrFail($id);
        [$enrollmentId, $subjectId, $quarterId] = [$component->enrollment_id, $component->subject_id, $component->quarter_id];
        $component->delete();
        $this->compute->execute($enrollmentId, $subjectId, $quarterId);
        $this->compute->recomputeFinal($enrollmentId, $subjectId);

        return response()->json(['data' => true]);
    }

    private function validatePayload(Request $request): array
    {
        return Validator::make($request->all(), [
            'enrollment_id' => 'required|integer|exists:enrollments,id',
            'subject_id' => 'required|integer|exists:subjects,id',
            'quarter_id' => 'required|integer|exists:quarters,id',
            'component_type' => 'required|in:written_work,performance_task,quarterly_assessment',
            'item_number' => 'required|integer|min:1|max:255',
            'score' => 'required|numeric|min:0',
            'highest_possible_score' => 'required|numeric|min:0.01',
        ])->validate();
    }
}
