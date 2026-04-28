<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\SchoolYear;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class EnrollmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $year = $request->integer('school_year_id') ?: SchoolYear::active()?->id;

        $enrollments = Enrollment::query()
            ->with([
                'student:id,lrn,first_name,middle_name,last_name,gender',
                'gradeLevel:id,name',
                'section:id,name',
                'schoolYear:id,label,is_active',
            ])
            ->when($year, fn ($q) => $q->where('school_year_id', $year))
            ->when($request->filled('grade_level_id'), fn ($q) => $q->where('grade_level_id', $request->integer('grade_level_id')))
            ->when($request->filled('section_id'), fn ($q) => $q->where('section_id', $request->integer('section_id')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('enrollment_type'), fn ($q) => $q->where('enrollment_type', $request->string('enrollment_type')))
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%'.$request->string('search').'%';
                $q->whereHas('student', function ($w) use ($term) {
                    $w->where('first_name', 'ilike', $term)
                        ->orWhere('last_name', 'ilike', $term)
                        ->orWhere('lrn', 'ilike', $term);
                });
            })
            ->orderByDesc('created_at')
            ->limit((int) $request->query('limit', 500))
            ->get();

        return response()->json(['data' => $enrollments]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules());
        $data['enrolled_by'] ??= $request->user()?->id;

        $enrollment = Enrollment::updateOrCreate(
            [
                'student_id' => $data['student_id'],
                'school_year_id' => $data['school_year_id'],
            ],
            $data,
        );

        return response()->json(['data' => $enrollment->load('student', 'gradeLevel', 'section')], 201);
    }

    public function show(string $id): JsonResponse
    {
        return response()->json([
            'data' => Enrollment::with('student', 'gradeLevel', 'section', 'schoolYear')->findOrFail($id),
        ]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $enrollment = Enrollment::findOrFail($id);
        $data = $request->validate($this->rules(true));
        $enrollment->fill($data)->save();

        return response()->json(['data' => $enrollment->load('student', 'gradeLevel', 'section')]);
    }

    public function destroy(string $id): JsonResponse
    {
        Enrollment::findOrFail($id)->delete();

        return response()->json(['data' => true]);
    }

    private function rules(bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return [
            'student_id' => [$required, 'integer', 'exists:students,id'],
            'school_year_id' => [$required, 'integer', 'exists:school_years,id'],
            'grade_level_id' => [$required, 'integer', 'exists:grade_levels,id'],
            'section_id' => ['nullable', 'integer', 'exists:sections,id'],
            'enrollment_date' => [$required, 'date'],
            'enrollment_type' => ['nullable', Rule::in(['new', 'continuing', 'transferee'])],
            'status' => ['nullable', Rule::in(['enrolled', 'transferred_in', 'transferred_out', 'dropped', 'completed', 'graduated'])],
            'transfer_date' => ['nullable', 'date'],
            'transfer_destination' => ['nullable', 'string', 'max:255'],
            'transfer_quarter' => ['nullable', 'integer', 'min:1', 'max:4'],
            'learning_modality' => ['nullable', Rule::in(['face_to_face', 'modular', 'online', 'blended'])],
            'is_summer_class' => ['nullable', 'boolean'],
            'qualifying_score' => ['nullable', 'numeric'],
            'enrolled_by' => ['nullable', 'integer', 'exists:users,id'],
        ];
    }
}
