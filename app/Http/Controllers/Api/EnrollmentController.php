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
        $year = null;
        if ($request->filled('school_year_id')) {
            $year = $request->integer('school_year_id');
        } elseif (! $request->filled('student_id')) {
            $year = SchoolYear::active()?->id;
        }

        $enrollments = Enrollment::query()
            ->with([
                'student:id,lrn,first_name,middle_name,last_name,gender',
                'gradeLevel:id,name',
                'section:id,name,type,session',
                'schoolYear:id,label,is_active',
            ])
            ->when($year, fn ($q) => $q->where('school_year_id', $year))
            ->when($request->filled('grade_level_id'), fn ($q) => $q->where('grade_level_id', $request->integer('grade_level_id')))
            ->when($request->filled('section_id'), fn ($q) => $q->where('section_id', $request->integer('section_id')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('enrollment_type'), fn ($q) => $q->where('enrollment_type', $request->string('enrollment_type')))
            ->when($request->filled('student_id'), fn ($q) => $q->where('student_id', $request->integer('student_id')))
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

        $enrollment->refresh();
        if ($enrollment->section_id) {
            Enrollment::assertCompatibleSection($enrollment, (int) $enrollment->section_id);
        }
        $enrollment->syncClassSessionFromSection();
        $enrollment->save();

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
<<<<<<< Updated upstream
        $enrollment->fill($data)->save();
=======

        $this->authorizeEnrollmentPlacementChanges($request, $data, $enrollment);

        $enrollment->fill($data);

        if (array_key_exists('section_id', $data)) {
            Enrollment::assertCompatibleSection($enrollment, $enrollment->section_id !== null ? (int) $enrollment->section_id : null);
        }

        $enrollment->syncClassSessionFromSection();
        $enrollment->save();
>>>>>>> Stashed changes

        return response()->json(['data' => $enrollment->load('student', 'gradeLevel', 'section')]);
    }

    public function destroy(string $id): JsonResponse
    {
        Enrollment::findOrFail($id)->delete();

        return response()->json(['data' => true]);
    }

<<<<<<< Updated upstream
=======
    /** @return array<int, int> */
    private function linkedStudentIds(?User $user): array
    {
        if (! $user || $user->role !== 'parent') {
            return [];
        }

        return ParentGuardian::query()
            ->where('user_id', $user->id)
            ->join('student_parents', 'parents.id', '=', 'student_parents.parent_id')
            ->pluck('student_parents.student_id')
            ->unique()
            ->values()
            ->all();
    }

    private function authorizeParentSchoolEnrollment(Request $request, int $studentId): void
    {
        $ids = $this->linkedStudentIds($request->user());
        abort_unless(in_array($studentId, $ids, true), 403, 'That learner is not linked to your guardian record.');
    }

    private function maybeAuthorizeParentEnrollment(Request $request, Enrollment $enrollment): void
    {
        if ($request->user()?->role !== 'parent') {
            return;
        }

        $this->authorizeParentSchoolEnrollment($request, (int) $enrollment->student_id);
    }

    /**
     * Section placement: school admins (`manage-enrollment`) or grade-level heads (`assign-enrollment-section`).
     * Grade changes use `promote-students`.
     */
    private function authorizeEnrollmentPlacementChanges(Request $request, array $data, ?Enrollment $existing): void
    {
        if ($request->user()->role === 'parent') {
            return;
        }

        if ($existing === null) {
            if (! empty($data['section_id'])) {
                $this->authorizeSectionAssignment($request);
            }

            return;
        }

        if (array_key_exists('section_id', $data)) {
            $new = isset($data['section_id']) && $data['section_id'] !== '' && $data['section_id'] !== null
                ? (int) $data['section_id']
                : null;
            $old = $existing->section_id !== null ? (int) $existing->section_id : null;
            if ($new !== $old) {
                $this->authorizeSectionAssignment($request);
            }
        }

        if (array_key_exists('grade_level_id', $data)
            && (int) $data['grade_level_id'] !== (int) $existing->grade_level_id) {
            Gate::authorize('promote-students');
        }
    }

    private function authorizeSectionAssignment(Request $request): void
    {
        if ($request->user()->can('manage-enrollment')) {
            Gate::authorize('manage-enrollment');

            return;
        }

        Gate::authorize('assign-enrollment-section');
    }

>>>>>>> Stashed changes
    private function rules(bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return [
            'student_id' => [$required, 'integer', 'exists:students,id'],
            'school_year_id' => [$required, 'integer', 'exists:school_years,id'],
            'grade_level_id' => [$required, 'integer', 'exists:grade_levels,id'],
            'section_id' => ['nullable', 'integer', 'exists:sections,id'],
            'class_session' => ['nullable', Rule::in(['AM', 'PM'])],
            'enrollment_date' => [$required, 'date'],
            'enrollment_type' => ['nullable', Rule::in(['new', 'continuing', 'transfer_in'])],
            'status' => ['nullable', Rule::in(['enrolled', 'pending', 'transferred_in', 'transferred_out', 'dropped', 'completed', 'graduated'])],
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
