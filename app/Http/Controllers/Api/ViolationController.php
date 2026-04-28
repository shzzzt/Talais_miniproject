<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\SchoolYear;
use App\Models\StudentViolation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ViolationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = StudentViolation::query()
            ->with(['student:id,first_name,middle_name,last_name,lrn'])
            ->when($request->filled('student_id'), fn ($q) => $q->where('student_id', $request->input('student_id')))
            ->when($request->filled('severity'), fn ($q) => $q->where('severity', $request->input('severity')));

        $orderBy = $request->string('order', '-date_of_incident')->value();
        $direction = str_starts_with($orderBy, '-') ? 'desc' : 'asc';
        $column = ltrim($orderBy, '-');
        $column = match ($column) {
            'created_date' => 'created_at',
            'date' => 'date_of_incident',
            default => $column,
        };

        $records = $query->orderBy($column, $direction)
            ->limit(min((int) $request->query('limit', 200), 1000))
            ->get();

        return response()->json([
            'data' => $records->map(fn ($r) => $this->present($r))->values(),
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $record = StudentViolation::with('student')->findOrFail($id);
        return response()->json(['data' => $this->present($record)]);
    }

    public function store(Request $request): JsonResponse
    {
        $payload = $this->validatePayload($request);
        $record = StudentViolation::create($this->prepare($payload, $request));
        $record->load('student');
        return response()->json(['data' => $this->present($record)], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $record = StudentViolation::findOrFail($id);
        $payload = $this->validatePayload($request);
        $record->fill($this->prepare($payload, $request, $record))->save();
        $record->load('student');
        return response()->json(['data' => $this->present($record)]);
    }

    public function destroy(string $id): JsonResponse
    {
        $record = StudentViolation::findOrFail($id);
        $record->delete();
        return response()->json(['data' => true]);
    }

    private function validatePayload(Request $request): array
    {
        return $request->validate([
            'student_id' => ['required', 'integer', 'exists:students,id'],
            'school_year_id' => ['nullable', 'integer', 'exists:school_years,id'],
            'date_of_incident' => ['nullable', 'date'],
            'date' => ['nullable', 'date'],
            'violation_type' => ['nullable', 'string', 'max:120'],
            'type' => ['nullable', 'string', 'max:120'],
            'severity' => ['required', 'in:minor,major'],
            'description' => ['nullable', 'string'],
            'action_taken' => ['nullable', 'string'],
            'action' => ['nullable', 'string'],
        ]);
    }

    private function prepare(array $payload, Request $request, ?StudentViolation $existing = null): array
    {
        return [
            'student_id' => $payload['student_id'],
            'school_year_id' => $payload['school_year_id'] ?? SchoolYear::active()?->id,
            'date_of_incident' => $payload['date_of_incident'] ?? $payload['date'] ?? now()->toDateString(),
            'violation_type' => $payload['violation_type'] ?? $payload['type'] ?? 'Other',
            'severity' => $payload['severity'],
            'description' => $payload['description'] ?? null,
            'action_taken' => $payload['action_taken'] ?? $payload['action'] ?? null,
            'recorded_by' => $existing?->recorded_by ?? $request->user()?->id,
        ];
    }

    private function present(StudentViolation $record): array
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
            'student_name' => $student ? trim($student->last_name.', '.$student->first_name) : null,
            'lrn' => $student?->lrn,
            'grade_level' => $enrollment?->gradeLevel?->name,
            'section' => $enrollment?->section?->name,
            'school_year_id' => $record->school_year_id,
            'date_of_incident' => $record->date_of_incident?->toDateString(),
            'date' => $record->date_of_incident?->toDateString(),
            'violation_type' => $record->violation_type,
            'type' => $record->violation_type,
            'severity' => $record->severity,
            'description' => $record->description,
            'action_taken' => $record->action_taken,
            'action' => $record->action_taken,
            'recorded_by' => $record->recorded_by,
            'created_at' => $record->created_at?->toIso8601String(),
            'updated_at' => $record->updated_at?->toIso8601String(),
        ];
    }
}
