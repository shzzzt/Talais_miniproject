<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\StudentResource;
use App\Models\Student;
use App\Services\StudentEnrollmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class StudentController extends Controller
{
    public function __construct(private readonly StudentEnrollmentService $service) {}

    public function index(Request $request): JsonResponse
    {
        $query = Student::query()
            ->with(['parents', 'currentEnrollment.gradeLevel', 'currentEnrollment.section'])
            ->when($request->filled('id'), fn ($q) => $q->where('id', $request->integer('id')))
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%'.$request->string('search').'%';
                $q->where(function ($w) use ($term) {
                    $w->where('first_name', 'ilike', $term)
                        ->orWhere('middle_name', 'ilike', $term)
                        ->orWhere('last_name', 'ilike', $term)
                        ->orWhere('lrn', 'ilike', $term);
                });
            })
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('grade_level_id'), function ($q) use ($request) {
                $q->whereHas('currentEnrollment', fn ($e) => $e->where('grade_level_id', $request->integer('grade_level_id')));
            })
            ->when($request->filled('section_id'), function ($q) use ($request) {
                $q->whereHas('currentEnrollment', fn ($e) => $e->where('section_id', $request->integer('section_id')));
            });

        $orderBy = $request->string('order', '-created_at')->value();
        $direction = str_starts_with($orderBy, '-') ? 'desc' : 'asc';
        $column = ltrim($orderBy, '-');
        $column = $column === 'created_date' ? 'created_at' : $column;
        if (in_array($column, ['last_name', 'first_name', 'lrn', 'created_at', 'updated_at'], true)) {
            $query->orderBy($column, $direction);
        } else {
            $query->orderByDesc('created_at');
        }

        $limit = (int) $request->query('limit', 200);
        $students = $query->limit(min($limit, 1000))->get();

        return response()->json(['data' => StudentResource::collection($students)->resolve()]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validatePayload($request);

        $student = $this->service->createOrUpdateStudent($data, null, $request->user()?->id);

        return response()->json(['data' => (new StudentResource($student))->resolve($request)], 201);
    }

    public function show(string $id): JsonResponse
    {
        $student = Student::with(['parents', 'currentEnrollment.gradeLevel', 'currentEnrollment.section', 'enrollments.gradeLevel', 'enrollments.section'])
            ->findOrFail($id);

        return response()->json(['data' => (new StudentResource($student))->resolve()]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $student = Student::findOrFail($id);
        $data = $this->validatePayload($request, $student->id);

        $updated = $this->service->createOrUpdateStudent($data, $student, $request->user()?->id);

        return response()->json(['data' => (new StudentResource($updated))->resolve($request)]);
    }

    public function destroy(string $id): JsonResponse
    {
        $student = Student::findOrFail($id);
        $student->delete();

        return response()->json(['data' => true]);
    }

    public function lookup(Request $request): JsonResponse
    {
        $request->validate(['lrn' => ['required', 'string', 'size:12']]);

        $student = $this->service->findContinuingByLrn((string) $request->string('lrn'));

        if (! $student) {
            return response()->json(['data' => null], 404);
        }

        return response()->json(['data' => (new StudentResource($student))->resolve()]);
    }

    private function validatePayload(Request $request, ?int $studentId = null): array
    {
        return $request->validate([
            'lrn' => ['nullable', 'string', 'size:12', Rule::unique('students', 'lrn')->ignore($studentId)],
            'first_name' => ['required', 'string', 'max:80'],
            'middle_name' => ['nullable', 'string', 'max:80'],
            'last_name' => ['required', 'string', 'max:80'],
            'suffix' => ['nullable', 'string', 'max:10'],
            'birth_date' => ['nullable', 'date'],
            'birthday' => ['nullable', 'date'],
            'gender' => ['required', Rule::in(['Male', 'Female'])],
            'address' => ['nullable', 'string', 'max:500'],
            'house_street_sitio' => ['nullable', 'string', 'max:150'],
            'barangay' => ['nullable', 'string', 'max:80'],
            'municipality_city' => ['nullable', 'string', 'max:80'],
            'province' => ['nullable', 'string', 'max:80'],
            'birth_place' => ['nullable', 'string', 'max:150'],
            'mother_tongue' => ['nullable', 'string', 'max:80'],
            'ip_ethnic_group' => ['nullable', 'string', 'max:80'],
            'religion' => ['nullable', 'string', 'max:80'],
            'birth_certificate_path' => ['nullable', 'string', 'max:500'],
            'status' => ['nullable', Rule::in(['enrolled', 'transferred_out', 'dropped', 'completed', 'alumni', 'transferred_in', 'graduated', 'pending_enrollment'])],

            'parent_name' => ['nullable', 'string', 'max:255'],
            'parent_contact' => ['nullable', 'string', 'max:30'],
            'parent_email' => ['nullable', 'email', 'max:191'],
            'parent_relationship' => ['nullable', 'string', 'max:50'],

            'current_grade_level' => ['nullable', 'string', 'max:30'],
            'current_grade_level_id' => ['nullable', 'integer'],
            'current_section_id' => ['nullable', 'integer'],
            'current_section_name' => ['nullable', 'string', 'max:50'],
            'enrollment_type' => ['nullable', 'string', 'max:20'],
            'learning_modality' => ['nullable', 'string', 'max:30'],
            'is_summer_class' => ['nullable', 'boolean'],
            'enrollment_date' => ['nullable', 'date'],
        ]);
    }
}
