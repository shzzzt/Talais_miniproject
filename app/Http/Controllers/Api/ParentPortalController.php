<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\ParentGuardian;
use App\Models\SchoolYear;
use App\Models\StudentGrade;
use App\Models\StudentViolation;
use App\Models\TransferRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ParentPortalController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();
        $activeYear = $request->attributes->get('active_school_year') ?? SchoolYear::active();

        $parent = ParentGuardian::query()
            ->where('user_id', $user->id)
            ->orWhere('email', $user->email)
            ->first();

        if (! $parent) {
            return response()->json([
                'data' => [
                    'school_year' => $activeYear?->only(['id', 'label']),
                    'children' => [],
                ],
            ]);
        }

        $children = $parent->students()->with([
            'enrollments' => function ($q) use ($activeYear) {
                $q->when($activeYear, fn ($e) => $e->where('school_year_id', $activeYear->id))
                    ->with(['gradeLevel', 'section.adviser']);
            },
        ])->get();

        $payload = $children->map(function ($student) use ($activeYear) {
            $enrollment = $student->enrollments->first();
            $grades = [];
            $attendance = ['present' => 0, 'absent' => 0, 'late' => 0, 'excused' => 0, 'total' => 0];
            $violations = [];
            $transfers = [];

            if ($enrollment) {
                $grades = StudentGrade::with(['subject', 'quarter'])
                    ->where('enrollment_id', $enrollment->id)
                    ->get()
                    ->groupBy(fn ($g) => $g->subject?->name ?? 'Subject')
                    ->map(function ($subjectGrades, $name) {
                        $row = ['subject' => $name, 'Q1' => null, 'Q2' => null, 'Q3' => null, 'Q4' => null, 'final' => null];
                        foreach ($subjectGrades as $g) {
                            $key = 'Q'.$g->quarter?->quarter_number;
                            if (in_array($key, ['Q1','Q2','Q3','Q4'], true)) {
                                $row[$key] = $g->quarterly_grade;
                            }
                            if ($g->final_grade !== null) {
                                $row['final'] = (float) $g->final_grade;
                            }
                        }
                        return $row;
                    })->values();

                $records = AttendanceRecord::where('enrollment_id', $enrollment->id)->get();
                foreach ($records as $rec) {
                    foreach (['am_status', 'pm_status'] as $col) {
                        $val = $rec->{$col};
                        if ($val) {
                            $attendance[$val] = ($attendance[$val] ?? 0) + 1;
                            $attendance['total']++;
                        }
                    }
                }
            }

            $violations = StudentViolation::where('student_id', $student->id)
                ->orderByDesc('date_of_incident')
                ->limit(50)
                ->get(['id', 'date_of_incident', 'violation_type', 'severity', 'description', 'action_taken']);

            $transfers = TransferRecord::query()
                ->where('student_id', $student->id)
                ->orderByDesc('transfer_date')
                ->limit(20)
                ->get(['id', 'transfer_type', 'transfer_date', 'to_school', 'reason', 'processed_by', 'created_at']);

            return [
                'student' => [
                    'id' => $student->id,
                    'lrn' => $student->lrn,
                    'name' => trim($student->last_name.', '.$student->first_name),
                    'first_name' => $student->first_name,
                    'last_name' => $student->last_name,
                    'middle_name' => $student->middle_name,
                    'suffix' => $student->suffix,
                    'gender' => $student->gender,
                    'birth_date' => $student->birth_date?->toDateString(),
                    'birth_place' => $student->birth_place,
                    'mother_tongue' => $student->mother_tongue,
                    'ip_ethnic_group' => $student->ip_ethnic_group,
                    'religion' => $student->religion,
                    'address' => collect([
                        $student->house_street_sitio,
                        $student->barangay,
                        $student->municipality_city,
                        $student->province,
                    ])->filter()->join(', '),
                    'status' => $student->status,
                ],
                'enrollment' => $enrollment ? [
                    'id' => $enrollment->id,
                    'grade_level' => $enrollment->gradeLevel?->name,
                    'section' => $enrollment->section?->name,
                    'adviser' => $enrollment->section?->adviser?->name,
                    'school_year_id' => $enrollment->school_year_id,
                ] : null,
                'grades' => $grades,
                'attendance_summary' => $attendance,
                'violations' => $violations,
                'transfer_requests' => $transfers,
            ];
        });

        return response()->json([
            'data' => [
                'school_year' => $activeYear?->only(['id', 'label']),
                'children' => $payload,
            ],
        ]);
    }
}
