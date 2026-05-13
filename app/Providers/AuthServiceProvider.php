<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        // Map model => policy here as policies are added in later waves.
    ];

    public function boot(): void
    {
        Gate::before(fn (User $user, string $ability) => $user->hasAdminRole() ? true : null);

        Gate::define('manage-users', fn (User $u) => $u->hasAdminRole());
        Gate::define('view-audit-logs', fn (User $u) => $u->hasAdminRole());
        Gate::define('manage-school-year', fn (User $u) => $u->hasAdminRole());
        Gate::define('manage-grade-levels', fn (User $u) => $u->hasAdminRole());
        Gate::define('manage-subjects', fn (User $u) => $u->hasAdminRole() || $u->hasSchoolAdminRole());

        Gate::define('view-students', fn (User $u) => $u->hasAdminRole() || $u->hasSchoolAdminRole() || $u->hasFacultyRole());
        Gate::define('manage-students', fn (User $u) => $u->hasAdminRole() || $u->hasSchoolAdminRole());
        Gate::define('import-students', fn (User $u) => $u->hasAdminRole() || $u->hasSchoolAdminRole());

        Gate::define('manage-enrollment', fn (User $u) => $u->hasAdminRole() || $u->hasSchoolAdminRole());
        Gate::define('manage-sections', fn (User $u) => $u->hasAdminRole() || $u->hasSchoolAdminRole());

        /** Assign learners to sections (exactly one tagged grade-level head per grade; set by system admin on faculty). */
        Gate::define('assign-enrollment-section', fn (User $u) => $u->hasFacultyRole() && (bool) $u->faculty?->is_grade_level_head);

        /** Promotions (grade level changes on enrollment) — school admin or grade-level head. */
        Gate::define('promote-students', fn (User $u) => $u->hasSchoolAdminRole()
            || ($u->hasFacultyRole() && (bool) $u->faculty?->is_grade_level_head));

        Gate::define('manage-class-schedule-records', fn (User $u) => $u->hasSchoolAdminRole()
            || ($u->hasFacultyRole() && (bool) $u->faculty?->is_grade_level_head));

        $reportsAndAnalytics = fn (User $u) => $u->hasAdminRole() || $u->hasSchoolAdminRole()
            || ($u->hasFacultyRole() && (bool) $u->faculty?->is_grade_level_head);

        Gate::define('input-grades', fn (User $u) => $u->hasFacultyRole());
        Gate::define('review-grades', fn (User $u) => $u->hasFacultyRole() && (bool) $u->faculty?->is_grade_level_head);
        Gate::define('finalize-grades', fn (User $u) => $u->hasAdminRole());

        Gate::define('input-attendance', fn (User $u) => $u->hasFacultyRole());
        Gate::define('manage-homeroom-guidance', fn (User $u) => $u->hasFacultyRole());

        Gate::define('manage-health-records', fn (User $u) => $u->hasAdminRole() || $u->hasFacultyRole());
        Gate::define('manage-violations', fn (User $u) => $u->hasAdminRole() || $u->hasSchoolAdminRole() || $u->hasFacultyRole());

        Gate::define('process-transfers', fn (User $u) => $u->hasAdminRole());
        Gate::define('manage-nat-results', fn (User $u) => $u->hasAdminRole());
        Gate::define('compute-kpi', fn (User $u) => $u->hasAdminRole());

        Gate::define('view-parent-portal', fn (User $u) => $u->hasParentRole());

        Gate::define('view-reports', $reportsAndAnalytics);
        Gate::define('export-reports', $reportsAndAnalytics);
        Gate::define('generate-pir', $reportsAndAnalytics);

        Gate::define('view-transfer-nat-kpi', fn (User $u) => $u->hasAdminRole()
            || ($u->hasFacultyRole() && (bool) $u->faculty?->is_grade_level_head));

        Gate::define('run-backups', fn (User $u) => $u->hasAdminRole());
        Gate::define('manage-notifications', fn (User $u) => $u->hasAdminRole());
    }
}
