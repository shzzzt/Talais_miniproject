<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\SchoolYear;
use App\Models\Student;
use App\Models\StudentHealthRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HealthRecordController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = StudentHealthRecord::query()
            ->with(['student:id,first_name,middle_name,last_name,lrn,birth_date'])
            ->when($request->filled('student_id'), fn ($q) => $q->where('student_id', $request->input('student_id')))
            ->when($request->filled('measurement_period'), fn ($q) => $q->whereDate('measurement_date', $request->input('measurement_period')))
            ->when($request->filled('feeding_only'), fn ($q) => $q->where('is_feeding_program', true));

        $orderBy = $request->string('order', '-created_at')->value();
        $direction = str_starts_with($orderBy, '-') ? 'desc' : 'asc';
        $column = ltrim($orderBy, '-');
        $column = $column === 'created_date' ? 'created_at' : $column;

        $records = $query->orderBy($column, $direction)
            ->limit(min((int) $request->query('limit', 200), 1000))
            ->get();

        return response()->json([
            'data' => $records->map(fn ($r) => $this->present($r))->values(),
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $record = StudentHealthRecord::with('student')->findOrFail($id);
        return response()->json(['data' => $this->present($record)]);
    }

    public function store(Request $request): JsonResponse
    {
        $payload = $this->validatePayload($request);
        $record = StudentHealthRecord::create($this->prepare($payload, $request));
        $record->load('student');
        return response()->json(['data' => $this->present($record)], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $record = StudentHealthRecord::findOrFail($id);
        $payload = $this->validatePayload($request);
        $record->fill($this->prepare($payload, $request, $record))->save();
        $record->load('student');
        return response()->json(['data' => $this->present($record)]);
    }

    public function destroy(string $id): JsonResponse
    {
        $record = StudentHealthRecord::findOrFail($id);
        $record->delete();
        return response()->json(['data' => true]);
    }

    private function validatePayload(Request $request): array
    {
        return $request->validate([
            'student_id' => ['required', 'integer', 'exists:students,id'],
            'school_year_id' => ['nullable', 'integer', 'exists:school_years,id'],
            'measurement_date' => ['nullable', 'date'],
            'date_recorded' => ['nullable', 'date'],
            'weight_kg' => ['required', 'numeric', 'min:1'],
            'height_cm' => ['required', 'numeric', 'min:30'],
            'bmi' => ['nullable', 'numeric'],
            'bmi_classification' => ['nullable', 'string'],
            'bmi_category' => ['nullable', 'string'],
            'is_feeding_program' => ['nullable', 'boolean'],
            'feeding_program' => ['nullable', 'boolean'],
            'remarks' => ['nullable', 'string'],
            'other_notes' => ['nullable', 'string'],
        ]);
    }

    private function prepare(array $payload, Request $request, ?StudentHealthRecord $existing = null): array
    {
        $weight = (float) $payload['weight_kg'];
        $height = (float) $payload['height_cm'];
        $bmi = $payload['bmi'] ?? $this->computeBmi($weight, $height);
        $classification = $payload['bmi_classification'] ?? $payload['bmi_category'] ?? $this->classifyBmi($bmi);

        $isFeeding = $payload['is_feeding_program']
            ?? $payload['feeding_program']
            ?? in_array($classification, ['Severely Wasted', 'Wasted'], true);

        return [
            'student_id' => $payload['student_id'],
            'school_year_id' => $payload['school_year_id'] ?? SchoolYear::active()?->id,
            'measurement_date' => $payload['measurement_date'] ?? $payload['date_recorded'] ?? now()->toDateString(),
            'weight_kg' => $weight,
            'height_cm' => $height,
            'bmi' => round($bmi, 2),
            'bmi_classification' => $classification,
            'is_feeding_program' => (bool) $isFeeding,
            'other_notes' => $payload['other_notes'] ?? $payload['remarks'] ?? null,
            'recorded_by' => $existing?->recorded_by ?? $request->user()?->id,
        ];
    }

    private function computeBmi(float $weight, float $height): float
    {
        if ($height <= 0) return 0.0;
        $m = $height / 100;
        return $weight / ($m * $m);
    }

    private function classifyBmi(float $bmi): string
    {
        if ($bmi < 14.0) return 'Severely Wasted';
        if ($bmi < 18.5) return 'Wasted';
        if ($bmi < 25.0) return 'Normal';
        if ($bmi < 30.0) return 'Overweight';
        return 'Obese';
    }

    private function present(StudentHealthRecord $record): array
    {
        $student = $record->student;
        $enrollment = $student
            ? Enrollment::with(['gradeLevel', 'section'])
                ->where('student_id', $student->id)
                ->where('school_year_id', $record->school_year_id)
                ->first()
            : null;

        return [
            'id' => $record->id,
            'student_id' => $record->student_id,
            'student_name' => $student ? trim($student->last_name.', '.$student->first_name.' '.($student->middle_name ?? '')) : null,
            'lrn' => $student?->lrn,
            'grade_level' => $enrollment?->gradeLevel?->name,
            'section_name' => $enrollment?->section?->name,
            'school_year_id' => $record->school_year_id,
            'measurement_date' => $record->measurement_date?->toDateString(),
            'date_recorded' => $record->measurement_date?->toDateString(),
            'weight_kg' => (float) $record->weight_kg,
            'height_cm' => (float) $record->height_cm,
            'bmi' => (float) $record->bmi,
            'bmi_category' => $record->bmi_classification,
            'bmi_classification' => $record->bmi_classification,
            'feeding_program' => (bool) $record->is_feeding_program,
            'is_feeding_program' => (bool) $record->is_feeding_program,
            'age_years' => $student?->birth_date ? $student->birth_date->age : null,
            'remarks' => $record->other_notes,
            'other_notes' => $record->other_notes,
            'created_at' => $record->created_at?->toIso8601String(),
            'updated_at' => $record->updated_at?->toIso8601String(),
        ];
    }
}
