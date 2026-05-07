<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/**
 * TALAIS web routes.
 *
 * Most pages are currently rendered as plain Inertia views. They will be
 * replaced with controller-backed routes in waves 1–6 of the rollout, but
 * this scaffolding keeps the React UI navigable end-to-end.
 */

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::middleware('role:admin|school_admin|faculty|parent')->group(function () {
        Route::get('/dashboard', fn() => Inertia::render('Dashboard'))->name('dashboard');
    });

    Route::middleware('role:admin|school_admin|faculty')->group(function () {
        Route::get('/Enrollment', fn() => Inertia::render('Enrollment'))->name('enrollment.index');
        Route::get('/Scheduling', fn() => Inertia::render('Scheduling'))->name('scheduling.index');
        Route::get('/HealthRecords', fn() => Inertia::render('HealthRecords'))->name('health.index');
        Route::get('/Violations', fn() => Inertia::render('Violations'))->name('violations.index');
        Route::get('/Form137', fn() => Inertia::render('Form137'))->name('form137.index');
        Route::get('/Reports', fn() => Inertia::render('Reports'))->name('reports.index');
        Route::get('/Analytics', fn() => Inertia::render('Analytics'))->name('analytics.index');
        Route::get('/Transfers', fn() => Inertia::render('Transfers'))->name('transfers.index');
        Route::get('/NatResults', fn() => Inertia::render('NatResults'))->name('nat.index');
        Route::get('/Kpi', fn() => Inertia::render('Kpi'))->name('kpi.index');
    });

    Route::middleware('role:admin|faculty')->group(function () {
        Route::get('/Attendance', fn() => Inertia::render('Attendance'))->name('attendance.index');
        Route::get('/Grading', fn() => Inertia::render('Grading'))->name('grading.index');
    });

    Route::middleware('role:admin|school_admin')->group(function () {
        Route::get('/SchoolYears', fn() => Inertia::render('SchoolYears'))->name('school-years.index');
        Route::get('/UserManagement', fn() => Inertia::render('UserManagement'))->name('users.index');
        Route::get('/AdminSettings', fn() => Inertia::render('AdminSettings'))->name('admin-settings.index');
    });

    Route::middleware('role:admin')->group(function () {
        Route::get('/Logs', fn() => Inertia::render('Logs'))->name('logs.index');
        Route::get('/DatabaseBackup', fn() => Inertia::render('DatabaseBackup'))->name('backup.index');
    });

    Route::middleware('role:admin|school_admin|faculty')->group(function () {
        Route::get('/Students', fn() => Inertia::render('Students'))->name('students.index');
        Route::get('/Sections', fn() => Inertia::render('Sections'))->name('sections.index');
        Route::get('/Subjects', fn() => Inertia::render('Subjects'))->name('subjects.index');
        Route::get('/StudentProfile/{id}', fn($id) => Inertia::render('StudentProfile', ['id' => $id]))
            ->whereNumber('id')
            ->name('students.show');
    });

    Route::middleware(['role:parent', 'parent.scope'])->group(function () {
        Route::get('/ParentPortal', fn() => Inertia::render('ParentPortal'))->name('parent-portal.index');
    });
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__ . '/auth.php';
