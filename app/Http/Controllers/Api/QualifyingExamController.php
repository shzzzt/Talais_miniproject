<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\SchoolYear;
use App\Models\Section;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class QualifyingExamController extends Controller
{
    public const CREAM_THRESHOLD = 85;

    /**
     * Enrollments for the active (or chosen) school year and grade, for qualifying score entry.
     */
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('manage-enrollment');

        $yearId = $request->filled('school_year_id')
            ? $request->integer('school_year_id')
            : SchoolYear::active()?->id;

        if (! $yearId) {
            return response()->json([
                'cream_threshold' => self::CREAM_THRESHOLD,
                'data' => [],
            ]);
        }

        $q = Enrollment::query()
            ->with([
                'student:id,lrn,first_name,middle_name,last_name',
                'gradeLevel:id,name',
                'section:id,name,type,grade_level_id,max_capacity,session',
            ])
            ->where('school_year_id', $yearId)
            ->whereIn('status', ['enrolled', 'pending']);

        if ($request->filled('grade_level_id')) {
            $q->where('grade_level_id', $request->integer('grade_level_id'));
        }

        $limit = min((int) $request->query('limit', 800), 1500);

        $enrollments = $q
            ->orderBy('student_id')
            ->limit($limit)
            ->get();

        return response()->json([
            'cream_threshold' => self::CREAM_THRESHOLD,
            'data' => $enrollments,
        ]);
    }

    /**
     * Persist raw scores (0–100) on enrollments for the qualifying exam.
     */
    public function bulkScores(Request $request): JsonResponse
    {
        Gate::authorize('manage-enrollment');

        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.enrollment_id' => ['required', 'integer', 'exists:enrollments,id'],
            'items.*.qualifying_score' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        DB::transaction(function () use ($validated) {
            foreach ($validated['items'] as $row) {
                $enrollment = Enrollment::findOrFail($row['enrollment_id']);
                $score = $row['qualifying_score'] ?? null;
                $enrollment->qualifying_score = $score === '' || $score === null ? null : round((float) $score, 2);
                $enrollment->save();
            }
        });

        return response()->json(['data' => true]);
    }

    /**
     * Place each learner with a recorded score into a section whose type (cream / regular)
     * matches the threshold, respecting capacity.
     */
    public function autoAssign(Request $request): JsonResponse
    {
        Gate::authorize('manage-enrollment');

        $validated = $request->validate([
            'school_year_id' => ['nullable', 'integer', 'exists:school_years,id'],
            'grade_level_id' => ['nullable', 'integer', 'exists:grade_levels,id'],
        ]);

        $yearId = $validated['school_year_id'] ?? SchoolYear::active()?->id;
        if (! $yearId) {
            return response()->json(['message' => 'No school year selected or active.'], 422);
        }

        $gradeLevelId = $validated['grade_level_id'] ?? null;

        $warnings = [];
        $assigned = 0;
        $skippedNoSection = 0;

        $enrollments = Enrollment::query()
            ->with(['section:id,type', 'gradeLevel:id,name,has_session'])
            ->where('school_year_id', $yearId)
            ->whereIn('status', ['enrolled', 'pending'])
            ->when($gradeLevelId, fn ($q) => $q->where('grade_level_id', $gradeLevelId))
            ->whereNotNull('qualifying_score')
            ->orderBy('id')
            ->get();

        $enrollmentStatuses = ['enrolled', 'pending'];

        foreach ($enrollments as $enrollment) {
            $score = (float) $enrollment->qualifying_score;
            $desiredType = $score >= self::CREAM_THRESHOLD ? 'cream' : 'regular';

            $sections = Section::query()
                ->where('school_year_id', $yearId)
                ->where('grade_level_id', $enrollment->grade_level_id)
                ->where('type', $desiredType)
                ->orderBy('name')
                ->get();

            $usesSession = $enrollment->gradeLevel?->usesSessionScheduling();
            if ($usesSession && $enrollment->class_session) {
                $sections = $sections->where('session', $enrollment->class_session)->values();
            }

            if ($sections->isEmpty()) {
                $skippedNoSection++;
                $warnings[] = 'No '.$desiredType.' section exists for '.$enrollment->gradeLevel?->name.'.';

                continue;
            }

            $picked = null;
            foreach ($sections as $section) {
                $count = Enrollment::query()
                    ->where('section_id', $section->id)
                    ->whereIn('status', $enrollmentStatuses)
                    ->count();
                if ($count < (int) $section->max_capacity) {
                    $picked = $section;
                    break;
                }
            }

            if (! $picked) {
                $skippedNoSection++;
                $warnings[] = 'All '.$desiredType.' sections are full for '.$enrollment->gradeLevel?->name.'.';

                continue;
            }

            if ((int) $enrollment->section_id === (int) $picked->id) {
                $assigned++;

                continue;
            }

            $enrollment->update(['section_id' => $picked->id]);
            $enrollment->refresh();
            Enrollment::assertCompatibleSection($enrollment, (int) $picked->id);
            $enrollment->syncClassSessionFromSection();
            $enrollment->save();
            $assigned++;
        }

        $skippedNoScore = (int) Enrollment::query()
            ->where('school_year_id', $yearId)
            ->whereIn('status', $enrollmentStatuses)
            ->when($gradeLevelId, fn ($q) => $q->where('grade_level_id', $gradeLevelId))
            ->whereNull('qualifying_score')
            ->count();

        return response()->json([
            'data' => [
                'assigned_or_confirmed' => $assigned,
                'learners_without_score' => $skippedNoScore,
                'could_not_place' => $skippedNoSection,
                'warnings' => array_slice(array_values(array_unique($warnings)), 0, 20),
            ],
        ]);
    }
}
