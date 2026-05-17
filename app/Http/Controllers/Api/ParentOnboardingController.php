<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ParentGuardian;
use App\Models\SchoolYear;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Supports parent-led registration completion: exposes linked children and
 * whether they still require school-level enrollment rows for the active year.
 */
class ParentOnboardingController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        abort_unless($request->user()?->role === 'parent', 403);

        $year = SchoolYear::where('is_active', true)->first();

        $parent = ParentGuardian::query()
            ->where('user_id', $request->user()->id)
            ->first();

        if (! $parent) {
            return response()->json([
                'data' => [
                    'guardian' => null,
                    'children' => [],
                    'active_school_year' => $year?->only(['id', 'label', 'start_date', 'end_date']),
                ],
            ]);
        }

        $parent->load([
            'students.enrollments.gradeLevel:id,name',
            'students.enrollments.section:id,name',
        ]);

        $children = $parent->students->map(function ($student) use ($year) {
            $enrollment = null;
            if ($year) {
                $enrollment = $student->enrollments->firstWhere('school_year_id', $year->id);
            }

            $needsSchoolEnrollment = false;
            if ($year) {
                $needsSchoolEnrollment = ! $enrollment;
            } else {
                $needsSchoolEnrollment = $student->enrollments->isEmpty();
            }

            return [
                'student' => [
                    'id' => $student->id,
                    'lrn' => $student->lrn,
                    'first_name' => $student->first_name,
                    'middle_name' => $student->middle_name,
                    'last_name' => $student->last_name,
                    'suffix' => $student->suffix,
                    'birth_date' => $student->birth_date?->toDateString(),
                    'gender' => $student->gender,
                    'birth_place' => $student->birth_place,
                    'mother_tongue' => $student->mother_tongue,
                    'ip_ethnic_group' => $student->ip_ethnic_group,
                    'religion' => $student->religion,
                    'house_street_sitio' => $student->house_street_sitio,
                    'barangay' => $student->barangay,
                    'municipality_city' => $student->municipality_city,
                    'province' => $student->province,
                    'status' => $student->status,
                ],
                'enrollment_for_active_year' => $enrollment ? [
                    'id' => $enrollment->id,
                    'grade_level_id' => $enrollment->grade_level_id,
                    'grade_level' => $enrollment->gradeLevel?->name,
                    'section_id' => $enrollment->section_id,
                    'section' => $enrollment->section?->name,
                    'enrollment_date' => $enrollment->enrollment_date?->toDateString(),
                    'enrollment_type' => $enrollment->enrollment_type,
                    'status' => $enrollment->status,
                ] : null,
                'needs_school_enrollment' => $needsSchoolEnrollment,
            ];
        })->values();

        return response()->json([
            'data' => [
                'guardian' => $parent->only([
                    'id', 'first_name', 'middle_name', 'last_name',
                    'relationship', 'contact_number', 'email', 'address',
                ]),
                'children' => $children,
                'active_school_year' => $year?->only(['id', 'label', 'start_date', 'end_date']),
            ],
        ]);
    }
}
