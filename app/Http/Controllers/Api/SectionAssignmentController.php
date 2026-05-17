<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\SchoolYear;
use App\Models\Section;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class SectionAssignmentController extends Controller
{
    /**
     * List enrollments for assigning learners to sections (same school year + grade as the section).
     */
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('assign-enrollment-section');

        $yearId = $request->filled('school_year_id')
            ? $request->integer('school_year_id')
            : SchoolYear::active()?->id;

        if (! $yearId) {
            return response()->json(['data' => []]);
        }

        $q = Enrollment::query()
            ->with([
                'student:id,lrn,first_name,middle_name,last_name,gender',
                'gradeLevel:id,name',
                'section:id,name,grade_level_id,school_year_id',                'schoolYear:id,label,is_active',
            ])
            ->where('school_year_id', $yearId)
            ->whereIn('status', ['enrolled', 'pending']);

        if ($request->boolean('unassigned_only')) {
            $q->whereNull('section_id');
        }

        if ($request->filled('grade_level_id')) {
            $q->where('grade_level_id', $request->integer('grade_level_id'));
        }

        if ($request->filled('section_id')) {
            $q->where('section_id', $request->integer('section_id'));
        }

        if ($request->filled('search')) {
            $term = '%'.$request->string('search').'%';
            $q->whereHas('student', function ($w) use ($term) {
                $w->where('first_name', 'ilike', $term)
                    ->orWhere('last_name', 'ilike', $term)
                    ->orWhere('lrn', 'ilike', $term);
            });
        }

        $limit = min((int) $request->query('limit', 500), 1000);

        $enrollments = $q
            ->orderBy('grade_level_id')
            ->orderBy('student_id')
            ->limit($limit)
            ->get();

        return response()->json(['data' => $enrollments]);
    }

    /**
     * Update only section placement for an enrollment.
     */
    public function update(Request $request, Enrollment $enrollment): JsonResponse
    {
        Gate::authorize('assign-enrollment-section');

        $validated = $request->validate([
            'section_id' => ['nullable', 'integer', 'exists:sections,id'],
        ]);

        $sectionId = $validated['section_id'] ?? null;

        if ($sectionId !== null) {
            $section = Section::findOrFail($sectionId);

            abort_unless(
                (int) $section->school_year_id === (int) $enrollment->school_year_id,
                422,
                'Section must belong to the same school year as the enrollment.',
            );

            abort_unless(
                (int) $section->grade_level_id === (int) $enrollment->grade_level_id,
                422,
                'Section must match the enrollment grade level.',
            );
        }

        $enrollment->update(['section_id' => $sectionId]);
        return response()->json([
            'data' => $enrollment->fresh()->load('student', 'gradeLevel', 'section', 'schoolYear'),
        ]);
    }
}
