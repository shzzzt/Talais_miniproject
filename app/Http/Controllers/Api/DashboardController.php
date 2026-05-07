<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\BackupLog;
use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\ParentGuardian;
use App\Models\SchoolYear;
use App\Models\Section;
use App\Models\Student;
use App\Models\StudentHealthRecord;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Spatie\Activitylog\Models\Activity;

class DashboardController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        $activeYear = SchoolYear::active() ?? SchoolYear::orderByDesc('id')->first();
        $yearId = $request->integer('school_year_id') ?: $activeYear?->id;

        $enrollmentQuery = Enrollment::query()->when($yearId, fn($q) => $q->where('school_year_id', $yearId));

        $enrolled = (clone $enrollmentQuery)->where('status', 'enrolled')->count();
        $transferred = (clone $enrollmentQuery)->whereIn('status', ['transferred_out', 'transferred'])->count();
        $dropped = (clone $enrollmentQuery)->where('status', 'dropped')->count();

        $sectionsCount = Section::query()
            ->when($yearId, fn($q) => $q->where('school_year_id', $yearId))
            ->count();

        $uniqueParents = ParentGuardian::query()->count();
        $feedingProgram = StudentHealthRecord::query()->where('is_feeding_program', true)->count();

        $byGrade = (clone $enrollmentQuery)
            ->where('status', 'enrolled')
            ->select('grade_level_id', DB::raw('count(*) as total'))
            ->groupBy('grade_level_id')
            ->pluck('total', 'grade_level_id');

        $gradeLevels = GradeLevel::orderBy('id')->get(['id', 'name']);
        $byGradeLabeled = $gradeLevels->map(fn($g) => [
            'grade_level_id' => $g->id,
            'grade_level' => $g->name,
            'count' => (int) ($byGrade[$g->id] ?? 0),
        ]);

        $genderBreakdown = (clone $enrollmentQuery)
            ->where('enrollments.status', 'enrolled')
            ->join('students', 'enrollments.student_id', '=', 'students.id')
            ->select('students.gender', DB::raw('count(*) as total'))
            ->groupBy('students.gender')
            ->pluck('total', 'gender');

        $today = now()->toDateString();
        $todayAttendance = AttendanceRecord::whereDate('date', $today)
            ->when($yearId, function ($q) use ($yearId) {
                $q->whereHas('enrollment', fn($e) => $e->where('school_year_id', $yearId));
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
            ->when($yearId, fn($q) => $q->where('enrollments.school_year_id', $yearId))
            ->groupBy('students.gender')
            ->pluck('total', 'gender');

        $passFail = DB::table('student_grades')
            ->join('enrollments', 'student_grades.enrollment_id', '=', 'enrollments.id')
            ->when($yearId, fn($q) => $q->where('enrollments.school_year_id', $yearId))
            ->whereNotNull('quarterly_grade')
            ->selectRaw("\n                count(*) as total,\n                sum(case when quarterly_grade >= ? then 1 else 0 end) as passing,\n                sum(case when quarterly_grade < ? then 1 else 0 end) as failing\n            ", [$passingMark, $passingMark])
            ->first();

        $gradeAverages = DB::table('student_grades')
            ->join('enrollments', 'student_grades.enrollment_id', '=', 'enrollments.id')
            ->join('grade_levels', 'enrollments.grade_level_id', '=', 'grade_levels.id')
            ->when($yearId, fn($q) => $q->where('enrollments.school_year_id', $yearId))
            ->whereNotNull('quarterly_grade')
            ->select('grade_levels.id', 'grade_levels.name', DB::raw('avg(quarterly_grade) as average_grade'))
            ->groupBy('grade_levels.id', 'grade_levels.name')
            ->orderBy('grade_levels.id')
            ->get();

        $attendanceByMonth = DB::table('attendance_records')
            ->join('enrollments', 'attendance_records.enrollment_id', '=', 'enrollments.id')
            ->when($yearId, fn($q) => $q->where('enrollments.school_year_id', $yearId))
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

    public function adminSummary(Request $request): JsonResponse
    {
        $startedAt = Cache::get('talais.app.started_at');
        if (! $startedAt) {
            $startedAt = now();
            Cache::forever('talais.app.started_at', $startedAt->toIso8601String());
        }

        $started = Carbon::parse($startedAt);
        $uptimeSeconds = now()->diffInSeconds($started);

        $txBase = Activity::query();
        $daily = [];
        $weekly = [];
        $monthly = [];

        $dailyRaw = (clone $txBase)
            ->where('created_at', '>=', now()->subDays(29)->startOfDay())
            ->selectRaw("to_char(created_at, 'YYYY-MM-DD') as bucket, count(*) as total")
            ->groupBy('bucket')
            ->pluck('total', 'bucket');

        for ($i = 29; $i >= 0; $i--) {
            $d = now()->subDays($i);
            $key = $d->format('Y-m-d');
            $daily[] = ['label' => $d->format('M d'), 'count' => (int) ($dailyRaw[$key] ?? 0)];
        }

        $weeklyRaw = (clone $txBase)
            ->where('created_at', '>=', now()->subWeeks(11)->startOfWeek())
            ->selectRaw("to_char(date_trunc('week', created_at), 'YYYY-MM-DD') as bucket, count(*) as total")
            ->groupBy('bucket')
            ->pluck('total', 'bucket');

        for ($i = 11; $i >= 0; $i--) {
            $w = now()->subWeeks($i)->startOfWeek();
            $key = $w->format('Y-m-d');
            $weekly[] = ['label' => 'Wk ' . $w->format('W'), 'count' => (int) ($weeklyRaw[$key] ?? 0)];
        }

        $monthlyRaw = (clone $txBase)
            ->where('created_at', '>=', now()->subMonths(11)->startOfMonth())
            ->selectRaw("to_char(date_trunc('month', created_at), 'YYYY-MM') as bucket, count(*) as total")
            ->groupBy('bucket')
            ->pluck('total', 'bucket');

        for ($i = 11; $i >= 0; $i--) {
            $m = now()->subMonths($i)->startOfMonth();
            $key = $m->format('Y-m');
            $monthly[] = ['label' => $m->format('M Y'), 'count' => (int) ($monthlyRaw[$key] ?? 0)];
        }

        $recent = Activity::query()
            ->with('causer:id,name,email,role')
            ->latest('created_at')
            ->limit(15)
            ->get()
            ->map(fn($a) => [
                'id' => $a->id,
                'description' => $a->description,
                'event' => $a->event,
                'log_name' => $a->log_name,
                'created_at' => $a->created_at?->toIso8601String(),
                'causer' => $a->causer ? [
                    'name' => $a->causer->name,
                    'role' => $a->causer->role,
                ] : null,
            ]);

        $usersTotal = User::count();
        $activeNow = User::where('last_login_at', '>=', now()->subMinutes(15))->count();
        $newRegistrations = User::where('created_at', '>=', now()->subDays(30)->startOfDay())->count();
        $userRegRaw = User::where('created_at', '>=', now()->subDays(29)->startOfDay())
            ->selectRaw("to_char(created_at, 'YYYY-MM-DD') as bucket, count(*) as total")
            ->groupBy('bucket')
            ->pluck('total', 'bucket');
        $userChart = [];
        for ($i = 29; $i >= 0; $i--) {
            $d = now()->subDays($i);
            $key = $d->format('Y-m-d');
            $userChart[] = ['label' => $d->format('M d'), 'count' => (int) ($userRegRaw[$key] ?? 0)];
        }

        $backupLast30 = BackupLog::where('created_at', '>=', now()->subDays(30))->count();
        $backupOk = BackupLog::where('created_at', '>=', now()->subDays(30))->where('status', 'success')->count();
        $backupRate = $backupLast30 > 0 ? round(($backupOk / $backupLast30) * 100, 1) : 100.0;

        $txToday = Activity::whereDate('created_at', today())->count();
        $tx30 = Activity::where('created_at', '>=', now()->subDays(30))->count();

        return response()->json([
            'data' => [
                'transactions' => [
                    'daily' => $daily,
                    'weekly' => $weekly,
                    'monthly' => $monthly,
                ],
                'system_health' => [
                    'uptime_seconds' => $uptimeSeconds,
                    'database_size_mb' => $this->databaseSizeMb(),
                    'storage_usage_mb' => round($this->dirSizeBytes(storage_path()) / 1024 / 1024, 2),
                ],
                'quick_actions' => [
                    ['label' => 'Create User', 'href' => '/UserManagement'],
                    ['label' => 'School Year Settings', 'href' => '/SchoolYears'],
                    ['label' => 'Run Database Backup', 'href' => '/DatabaseBackup'],
                    ['label' => 'Create Sections', 'href' => '/Sections'],
                    ['label' => 'Create Subjects', 'href' => '/Subjects'],
                    ['label' => 'View Logs', 'href' => '/Logs'],
                ],
                'recent_activities' => $recent,
                'performance_metrics' => [
                    'transactions_today' => $txToday,
                    'avg_daily_transactions_30d' => round($tx30 / 30, 1),
                    'backup_success_rate_30d' => $backupRate,
                    'error_count_today' => $this->errorCountToday(),
                ],
                'user_statistics' => [
                    'total_users' => $usersTotal,
                    'active_now' => $activeNow,
                    'new_registrations_30d' => $newRegistrations,
                    'chart' => $userChart,
                ],
            ],
        ]);
    }

    private function databaseSizeMb(): float
    {
        $driver = DB::connection()->getDriverName();

        try {
            if ($driver === 'pgsql') {
                $row = DB::selectOne("select pg_database_size(current_database()) as size");
                return round(((float) ($row->size ?? 0)) / 1024 / 1024, 2);
            }

            if ($driver === 'mysql') {
                $row = DB::selectOne('select sum(data_length + index_length) as size from information_schema.tables where table_schema = database()');
                return round(((float) ($row->size ?? 0)) / 1024 / 1024, 2);
            }

            if ($driver === 'sqlite') {
                $path = DB::connection()->getDatabaseName();
                return file_exists($path) ? round(filesize($path) / 1024 / 1024, 2) : 0.0;
            }
        } catch (\Throwable) {
            return 0.0;
        }

        return 0.0;
    }

    private function dirSizeBytes(string $dir): int
    {
        if (! is_dir($dir)) {
            return 0;
        }

        $size = 0;
        $it = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($dir, \FilesystemIterator::SKIP_DOTS));
        foreach ($it as $file) {
            if ($file->isFile()) {
                $size += $file->getSize();
            }
        }

        return $size;
    }

    private function errorCountToday(): int
    {
        $logPath = storage_path('logs/laravel.log');
        if (! file_exists($logPath)) {
            return 0;
        }

        $today = now()->format('Y-m-d');
        $count = 0;
        $lines = @file($logPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
        foreach ($lines as $line) {
            if (str_contains($line, $today) && preg_match('/\.(ERROR|CRITICAL|ALERT|EMERGENCY):/i', $line)) {
                $count++;
            }
        }

        return $count;
    }
}
