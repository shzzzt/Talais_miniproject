<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\NatResult;
use App\Models\SchoolYear;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NatResultController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $records = NatResult::query()
            ->with(['subject:id,name', 'gradeLevel:id,name', 'schoolYear:id,label'])
            ->when($request->filled('school_year_id'), fn ($q) => $q->where('school_year_id', $request->input('school_year_id')))
            ->when($request->filled('grade_level_id'), fn ($q) => $q->where('grade_level_id', $request->input('grade_level_id')))
            ->when($request->filled('subject_id'), fn ($q) => $q->where('subject_id', $request->input('subject_id')))
            ->orderByDesc('school_year_id')
            ->limit(min((int) $request->query('limit', 200), 1000))
            ->get();

        return response()->json([
            'data' => $records->map(fn ($r) => $this->present($r))->values(),
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $record = NatResult::with(['subject', 'gradeLevel', 'schoolYear'])->findOrFail($id);
        return response()->json(['data' => $this->present($record)]);
    }

    public function store(Request $request): JsonResponse
    {
        $payload = $this->validatePayload($request);
        $payload['recorded_by'] = $request->user()?->id;
        $payload['proficiency_level'] = $payload['proficiency_level'] ?? $this->classify($payload['mean_percentage_score']);
        $record = NatResult::create($this->prepare($payload));
        $record->load(['subject', 'gradeLevel', 'schoolYear']);
        return response()->json(['data' => $this->present($record)], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $record = NatResult::findOrFail($id);
        $payload = $this->validatePayload($request);
        $payload['proficiency_level'] = $payload['proficiency_level'] ?? $this->classify($payload['mean_percentage_score']);
        $record->fill($this->prepare($payload))->save();
        $record->load(['subject', 'gradeLevel', 'schoolYear']);
        return response()->json(['data' => $this->present($record)]);
    }

    public function destroy(string $id): JsonResponse
    {
        $record = NatResult::findOrFail($id);
        $record->delete();
        return response()->json(['data' => true]);
    }

    private function validatePayload(Request $request): array
    {
        return $request->validate([
            'school_year_id' => ['nullable', 'integer', 'exists:school_years,id'],
            'subject_id' => ['required', 'integer', 'exists:subjects,id'],
            'grade_level_id' => ['required', 'integer', 'exists:grade_levels,id'],
            'mean_percentage_score' => ['required', 'numeric', 'min:0', 'max:100'],
            'number_of_takers' => ['required', 'integer', 'min:0'],
            'proficiency_level' => ['nullable', 'string'],
            'remarks' => ['nullable', 'string'],
        ]);
    }

    private function prepare(array $payload): array
    {
        return [
            'school_year_id' => $payload['school_year_id'] ?? SchoolYear::active()?->id,
            'subject_id' => $payload['subject_id'],
            'grade_level_id' => $payload['grade_level_id'],
            'mean_percentage_score' => $payload['mean_percentage_score'],
            'number_of_takers' => $payload['number_of_takers'],
            'proficiency_level' => $payload['proficiency_level'] ?? null,
            'remarks' => $payload['remarks'] ?? null,
            'recorded_by' => $payload['recorded_by'] ?? null,
        ];
    }

    private function classify(float $mps): string
    {
        if ($mps >= 96) return 'Advanced';
        if ($mps >= 86) return 'Proficient';
        if ($mps >= 66) return 'Approaching Proficiency';
        if ($mps >= 35) return 'Developing';
        return 'Beginning';
    }

    private function present(NatResult $record): array
    {
        return [
            'id' => $record->id,
            'school_year_id' => $record->school_year_id,
            'school_year' => $record->schoolYear?->label,
            'subject_id' => $record->subject_id,
            'subject' => $record->subject?->name,
            'grade_level_id' => $record->grade_level_id,
            'grade_level' => $record->gradeLevel?->name,
            'mean_percentage_score' => (float) $record->mean_percentage_score,
            'number_of_takers' => $record->number_of_takers,
            'proficiency_level' => $record->proficiency_level,
            'remarks' => $record->remarks,
            'created_at' => $record->created_at?->toIso8601String(),
            'updated_at' => $record->updated_at?->toIso8601String(),
        ];
    }
}
