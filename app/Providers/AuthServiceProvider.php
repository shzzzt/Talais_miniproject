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
        Gate::before(function (User $user, string $ability) {
            return $user->hasRole('admin') ? true : null;
        });

        Gate::define('manage-users', fn (User $u) => $u->hasRole('admin'));
        Gate::define('view-audit-logs', fn (User $u) => $u->hasRole('admin'));
        Gate::define('manage-school-year', fn (User $u) => $u->hasRole('admin'));
        Gate::define('manage-grade-levels', fn (User $u) => $u->hasRole('admin'));
        Gate::define('manage-subjects', fn (User $u) => $u->hasAnyRole(['admin', 'school_admin']));

        Gate::define('view-students', fn (User $u) => $u->hasAnyRole(['admin', 'faculty', 'school_admin']));
        Gate::define('manage-students', fn (User $u) => $u->hasAnyRole(['admin', 'school_admin']));
        Gate::define('import-students', fn (User $u) => $u->hasAnyRole(['admin', 'school_admin']));

        Gate::define('manage-enrollment', fn (User $u) => $u->hasAnyRole(['admin', 'school_admin']));
        Gate::define('manage-sections', fn (User $u) => $u->hasAnyRole(['admin', 'school_admin']));

        Gate::define('input-grades', fn (User $u) => $u->hasRole('faculty'));
        Gate::define('review-grades', fn (User $u) => $u->hasRole('faculty') && $u->is_grade_level_head);
        Gate::define('finalize-grades', fn (User $u) => $u->hasRole('admin'));

        Gate::define('input-attendance', fn (User $u) => $u->hasRole('faculty'));
        Gate::define('manage-homeroom-guidance', fn (User $u) => $u->hasRole('faculty'));

        Gate::define('manage-health-records', fn (User $u) => $u->hasAnyRole(['admin', 'faculty']));
        Gate::define('manage-violations', fn (User $u) => $u->hasAnyRole(['admin', 'faculty', 'school_admin']));

        Gate::define('process-transfers', fn (User $u) => $u->hasRole('admin'));
        Gate::define('manage-nat-results', fn (User $u) => $u->hasRole('admin'));
        Gate::define('compute-kpi', fn (User $u) => $u->hasRole('admin'));

        Gate::define('view-parent-portal', fn (User $u) => $u->hasRole('parent'));

        Gate::define('view-reports', fn (User $u) => $u->hasAnyRole(['admin', 'faculty', 'school_admin']));
        Gate::define('export-reports', fn (User $u) => $u->hasAnyRole(['admin', 'faculty', 'school_admin']));
        Gate::define('generate-pir', fn (User $u) => $u->hasAnyRole(['admin', 'faculty', 'school_admin']));

        Gate::define('run-backups', fn (User $u) => $u->hasRole('admin'));
        Gate::define('manage-notifications', fn (User $u) => $u->hasRole('admin'));
    }
}
