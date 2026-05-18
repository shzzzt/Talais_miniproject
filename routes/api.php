<?php

use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\BackupLogController;
use App\Http\Controllers\Api\ClassScheduleController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\EnrollmentController;
use App\Http\Controllers\Api\FacultyController;
use App\Http\Controllers\Api\GradeController;
use App\Http\Controllers\Api\GradeLevelController;
use App\Http\Controllers\Api\GradeReviewController;
use App\Http\Controllers\Api\HealthRecordController;
use App\Http\Controllers\Api\HomeroomGuidanceController;
use App\Http\Controllers\Api\KpiController;
use App\Http\Controllers\Api\MeController;
use App\Http\Controllers\Api\NatResultController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ParentChatbotController;
use App\Http\Controllers\Api\ParentController;
use App\Http\Controllers\Api\ParentOnboardingController;
use App\Http\Controllers\Api\ParentPortalController;
use App\Http\Controllers\Api\PirReportController;
use App\Http\Controllers\Api\QualifyingExamController;
use App\Http\Controllers\Api\QuarterController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\ReportExcelController;
use App\Http\Controllers\Api\SchoolSettingController;
use App\Http\Controllers\Api\SchoolYearController;
use App\Http\Controllers\Api\SectionAssignmentController;
use App\Http\Controllers\Api\SectionController;
use App\Http\Controllers\Api\Sf3BookController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\StudentImportController;
use App\Http\Controllers\Api\SubjectController;
use App\Http\Controllers\Api\SystemLogController;
use App\Http\Controllers\Api\TransferController;
use App\Http\Controllers\Api\UploadController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\ViolationController;
use Illuminate\Support\Facades\Route;

/**
 * TALAIS REST API (mounted at /api/v1).
 *
 * The frontend talks to these endpoints through `resources/js/lib/api.js`.
 * Sanctum stateful cookies are used for authentication, so all routes are
 * placed behind the `auth:sanctum` guard and rely on the session cookie.
 */
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/me', MeController::class);

    Route::middleware(['role:parent'])->get(
        '/parent/onboarding-summary',
        [ParentOnboardingController::class, 'summary'],
    )->name('parent.onboarding-summary');

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);

    Route::post('/uploads', UploadController::class);

    Route::get('/dashboard/summary', [DashboardController::class, 'summary'])->name('dashboard.summary');
    Route::get('/dashboard/analytics', [DashboardController::class, 'analytics'])->name('dashboard.analytics');

    Route::get('/settings/school', [SchoolSettingController::class, 'show']);
    Route::put('/settings/school', [SchoolSettingController::class, 'update'])
        ->middleware('role:admin');

    Route::apiResource('grade-levels', GradeLevelController::class);
    Route::get('school-years/overview', [SchoolYearController::class, 'overview'])->name('school-years.overview');
    Route::post('school-years/rollover', [SchoolYearController::class, 'rollover'])
        ->middleware('role:admin')
        ->name('school-years.rollover');

    Route::apiResource('school-years', SchoolYearController::class);
    Route::apiResource('sections', SectionController::class);
    Route::apiResource('subjects', SubjectController::class);
    Route::apiResource('quarters', QuarterController::class);
    Route::get('faculty/unlinked-faculty-logins', [FacultyController::class, 'unlinkedFacultyLogins'])
        ->middleware('role:school_admin');
    Route::post('faculty/bootstrap-unlinked', [FacultyController::class, 'bootstrapUnlinked'])
        ->middleware('role:school_admin');
    Route::apiResource('faculty', FacultyController::class);
    Route::apiResource('parents', ParentController::class);

    Route::get('students/lookup', [StudentController::class, 'lookup'])->name('students.lookup');
    Route::apiResource('students', StudentController::class);

    Route::apiResource('enrollments', EnrollmentController::class);
    Route::post('students/import', StudentImportController::class)->name('students.import');

    Route::get('section-assignments', [SectionAssignmentController::class, 'index'])
        ->middleware('can:assign-enrollment-section');
    Route::patch('section-assignments/{enrollment}', [SectionAssignmentController::class, 'update'])
        ->middleware('can:assign-enrollment-section');

    Route::apiResource('class-schedules', ClassScheduleController::class);
    Route::apiResource('grades', GradeController::class);
    Route::post('attendance/bulk', [AttendanceController::class, 'bulk'])->name('attendance.bulk');
    Route::get('attendance/summary', [AttendanceController::class, 'summary'])->name('attendance.summary');
    Route::apiResource('attendance', AttendanceController::class);
    Route::apiResource('homeroom-guidance', HomeroomGuidanceController::class);
    Route::apiResource('sf3-book-records', Sf3BookController::class);
    Route::apiResource('health-records', HealthRecordController::class);
    Route::apiResource('violations', ViolationController::class);
    Route::apiResource('transfers', TransferController::class);
    Route::apiResource('nat-results', NatResultController::class);
    Route::post('kpis/compute', [KpiController::class, 'compute'])->name('kpis.compute');
    Route::apiResource('kpis', KpiController::class);
    Route::apiResource('pir-reports', PirReportController::class);
    Route::apiResource('grade-reviews', GradeReviewController::class);

    Route::middleware(['role:parent', 'parent.scope'])->group(function () {
        Route::post('parent/chatbot', ParentChatbotController::class)->name('parent.chatbot');
        Route::post('parent/register-student', [ParentController::class, 'registerStudent'])->name('parent.register-student');
        Route::get('parent-portal', ParentPortalController::class)->name('parent-portal.index');
    });

    Route::prefix('reports')->name('reports.')->group(function () {
        Route::get('sf1', [ReportController::class, 'sf1'])->name('sf1');
        Route::get('sf2', [ReportController::class, 'sf2'])->name('sf2');
        Route::get('sf4', [ReportController::class, 'sf4'])->name('sf4');
        Route::get('sf5', [ReportController::class, 'sf5'])->name('sf5');
        Route::get('form137', [ReportController::class, 'form137'])->name('form137');
        Route::get('form138', [ReportController::class, 'form138'])->name('form138');
        Route::get('good-moral', [ReportController::class, 'goodMoral'])->name('good-moral');
        Route::get('pir', [ReportController::class, 'pir'])->name('pir');
    });

    Route::prefix('reports/excel')->name('reports.excel.')->group(function () {
        Route::get('sf1', [ReportExcelController::class, 'sf1'])->name('sf1');
        Route::get('sf2', [ReportExcelController::class, 'sf2'])->name('sf2');
        Route::get('sf4', [ReportExcelController::class, 'sf4'])->name('sf4');
        Route::get('sf5', [ReportExcelController::class, 'sf5'])->name('sf5');
        Route::get('form137', [ReportExcelController::class, 'form137'])->name('form137');
        Route::get('form138', [ReportExcelController::class, 'form138'])->name('form138');
        Route::post('form138/import', [ReportExcelController::class, 'importForm138'])->name('form138.import');
        Route::get('pir', [ReportExcelController::class, 'pir'])->name('pir');
    });

    Route::middleware(['role:admin|school_admin'])->group(function () {
        Route::put('departments/{department}/assignments', [DepartmentController::class, 'syncAssignments']);
        Route::apiResource('departments', DepartmentController::class);

        Route::get('qualifying-exams', [QualifyingExamController::class, 'index'])->name('qualifying-exams.index');
        Route::post('qualifying-exams/bulk-scores', [QualifyingExamController::class, 'bulkScores'])->name('qualifying-exams.bulk-scores');
        Route::post('qualifying-exams/auto-assign', [QualifyingExamController::class, 'autoAssign'])->name('qualifying-exams.auto-assign');
    });

    Route::middleware(['role:admin|school_admin'])->group(function () {
        Route::put('departments/{department}/assignments', [DepartmentController::class, 'syncAssignments']);
        Route::apiResource('departments', DepartmentController::class);

        Route::apiResource('users', UserController::class);
        Route::post('users/{user}/restore', [UserController::class, 'restore']);
        Route::post('users/{user}/unlock', [UserController::class, 'unlock']);
    });

    Route::middleware(['role:admin'])->group(function () {
        Route::get('/dashboard/admin-summary', [DashboardController::class, 'adminSummary'])->name('dashboard.admin-summary');
        Route::get('system-logs/auth', [SystemLogController::class, 'auth']);
        Route::get('system-logs/access', [SystemLogController::class, 'access']);
        Route::get('system-logs/errors', [SystemLogController::class, 'errors']);
        Route::post('backup-logs/run', [BackupLogController::class, 'run'])->name('backup-logs.run');
        Route::get('backup-logs/{id}/download', [BackupLogController::class, 'download'])->name('backup-logs.download');
        Route::apiResource('backup-logs', BackupLogController::class)->only(['index', 'show', 'store']);
    });

    Route::middleware(['role:admin|school_admin'])->group(function () {
        Route::apiResource('audit-logs', AuditLogController::class)->only(['index', 'show']);
    });
});
