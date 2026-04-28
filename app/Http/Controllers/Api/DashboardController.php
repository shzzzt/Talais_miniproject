<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\ParentGuardian;
use App\Models\SchoolYear;
use App\Models\Section;
use App\Models\Student;
use App\Models\StudentHealthRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        $activeYear = SchoolYear::active() ?? SchoolYear::orderByDesc('id')->first();
        $yearId = $request->integer('school_year_id') ?: $activeYear?->id;

        $enrollmentQuery = Enrollment::query()->when($yearId, fn ($q) => $q->where('school_year_id', $yearId));

        $enrolled = (clone $enrollmentQuery)->where('status', 'enrolled')->count();
        $transferred = (clone $enrollmentQuery)->whereIn('status', ['transferred_out', 'transferred'])->count();
        $dropped = (clone $enrollmentQuery)->where('status', 'dropped')->count();

        $sectionsCount = Section::query()
            ->when($yearId, fn ($q) => $q->where('school_year_id', $yearId))
            ->count();

        $uniqueParents = ParentGuardian::query()->count();
        $feedingProgram = StudentHealthRecord::query()->where('feeding_program', true)->count();

        $byGrade = (clone $enrollmentQuery)
            ->where('status', 'enrolled')
            ->select('grade_level_id', DB::raw('count(*) as total'))
            ->groupBy('grade_level_id')
            ->pluck('total', 'grade_level_id');

        $gradeLevels = GradeLevel::orderBy('id')->get(['id', 'name']);
        $byGradeLabeled = $gradeLevels->map(fn ($g) => [
            'grade_level_id' => $g->id,
            'grade_level' => $g->name,
            'count' => (int) ($byGrade[$g->id] ?? 0),
        ]);

        $genderBreakdown = (clone $enrollmentQuery)
            ->where('status', 'enrolled')
            ->join('students', 'enrollments.student_id', '=', 'students.id')
            ->select('students.gender', DB::raw('count(*) as total'))
            ->groupBy('students.gender')
            ->pluck('total', 'gender');

        $today = now()->toDateString();
        $todayAttendance = AttendanceRecord::whereDate('date', $today)
            ->when($yearId, function ($q) use ($yearId) {
                $q->whereHas('enrollment', fn ($e) => $e->where('school_year_id', $yearId));
            })
            ->selectRaw("\n                count(*) as total,\n                sum(case when am_status = 'present' or pm_status = 'present' then 1 else 0 end) as present_count,\n                sum(case when am_status = 'absent' or pm_status = 'absent' then 1 else 0 end) as absent_count,\n                sum(case when am_status = 'late' or pm_status = 'late' then 1 else 0 end) as late_count\n            ")
            ->first();

        return response()->json([
            'data' => [
                'school_year' => $activeYear ? [
                    'id' => $activeYear->id,
                    'label' => $activeYear->label,
                    'name' => $activeYear->label,
                    'is_active' => (bool) $activeYear->is_active,
                ] : null,
                'totals' => [
                    'enrolled' => $enrolled,
                    'transferred' => $transferred,
                    'dropped' => $dropped,
                    'sections' => $sectionsCount,
                    'parents' => $uniqueParents,
                    'feeding_program' => $feedingProgram,
                ],
                'by_grade_level' => $byGradeLabeled,
                'by_gender' => $genderBreakdown,
                'today_attendance' => [
                    'date' => $today,
                    'total' => (int) ($todayAttendance->total ?? 0),
                    'present' => (int) ($todayAttendance->present_count ?? 0),
                    'absent' => (int) ($todayAttendance->absent_count ?? 0),
                    'late' => (int) ($todayAttendance->late_count ?? 0),
                ],
            ],
        ]);
    }

    public function analytics(Request $request): JsonResponse
    {
        $activeYear = SchoolYear::active() ?? SchoolYear::orderByDesc('id')->first();
        $yearId = $request->integer('school_year_id') ?: $activeYear?->id;

        $passingMark = 75;

        $genderEnrollment = Student::query()
            ->select('students.gender', DB::raw('count(*) as total'))
            ->join('enrollments', 'students.id', '=', 'enrollments.student_id')
            ->where('enrollments.status', 'enrolled')
            ->when($yearId, fn ($q) => $q->where('enrollments.school_year_id', $yearId))
            ->groupBy('students.gender')
            ->pluck('total', 'gender');

        $passFail = DB::table('student_grades')
            ->join('enrollments', 'student_grades.enrollment_id', '=', 'enrollments.id')
            ->when($yearId, fn ($q) => $q->where('enrollments.school_year_id', $yearId))
            ->whereNotNull('quarterly_grade')
            ->selectRaw("\n                count(*) as total,\n                sum(case when quarterly_grade >= ? then 1 else 0 end) as passing,\n                sum(case when quarterly_grade < ? then 1 else 0 end) as failing\n            ", [$passingMark, $passingMark])
            ->first();

        $gradeAverages = DB::table('student_grades')
            ->join('enrollments', 'student_grades.enrollment_id', '=', 'enrollments.id')
            ->join('grade_levels', 'enrollments.grade_level_id', '=', 'grade_levels.id')
            ->when($yearId, fn ($q) => $q->where('enrollments.school_year_id', $yearId))
            ->whereNotNull('quarterly_grade')
            ->select('grade_levels.id', 'grade_levels.name', DB::raw('avg(quarterly_grade) as average_grade'))
            ->groupBy('grade_levels.id', 'grade_levels.name')
            ->orderBy('grade_levels.id')
            ->get();

        $attendanceByMonth = DB::table('attendance_records')
            ->join('enrollments', 'attendance_records.enrollment_id', '=', 'enrollments.id')
            ->when($yearId, fn ($q) => $q->where('enrollments.school_year_id', $yearId))
            ->selectRaw("\n                to_char(date, 'YYYY-MM') as month,\n                count(*) as total,\n                sum(case when am_status = 'absent' or pm_status = 'absent' then 1 else 0 end) as absences\n            ")
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        return response()->json([
            'data' => [
                'school_year_id' => $yearId,
                'gender_enrollment' => $genderEnrollment,
                'pass_fail' => [
                    'total' => (int) ($passFail->total ?? 0),
                    'passing' => (int) ($passFail->passing ?? 0),
                    'failing' => (int) ($passFail->failing ?? 0),
                ],
                'grade_averages' => $gradeAverages,
                'attendance_by_month' => $attendanceByMonth,
            ],
        ]);
    }
}
