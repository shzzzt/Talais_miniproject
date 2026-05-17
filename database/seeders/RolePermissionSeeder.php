<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    /**
     * Permissions list, derived from the TALAIS access matrix in §2.
     * Format is `<resource>.<action>` for fine-grained authorization.
     */
    public const PERMISSIONS = [
        'students.view',
        'students.create',
        'students.update',
        'students.delete',
        'students.import',
        'students.export',

        'enrollments.view',
        'enrollments.create',
        'enrollments.update',
        'enrollments.delete',
        'enrollments.assign_section',

        'sections.view',
        'sections.create',
        'sections.update',
        'sections.delete',

        'subjects.view',
        'subjects.manage',

        'school_years.view',
        'school_years.manage',

        'grade_levels.view',
        'grade_levels.manage',

        'class_schedules.view',
        'class_schedules.manage',

        'grades.view',
        'grades.input',
        'grades.update',
        'grades.review',
        'grades.finalize',

        'attendance.view',
        'attendance.input',
        'attendance.update',
        'attendance.notify',

        'homeroom_guidance.view',
        'homeroom_guidance.input',
        'homeroom_guidance.update',

        'health.view',
        'health.input',
        'health.update',

        'violations.view',
        'violations.create',
        'violations.update',

        'transfers.view',
        'transfers.process',

        'reports.dashboard',
        'reports.analytics',
        'reports.sf1',
        'reports.sf2',
        'reports.sf3',
        'reports.sf4',
        'reports.sf5',
        'reports.form137',
        'reports.form138',
        'reports.pir',
        'reports.export',

        'nat_results.view',
        'nat_results.manage',

        'kpi.view',
        'kpi.compute',

        'parent_portal.view',

        'users.view',
        'users.create',
        'users.update',
        'users.delete',
        'users.assign_roles',

        'audit_logs.view',
        'admin_settings.view',
        'admin_settings.update',
        'backups.view',
        'backups.run',
        'notifications.view',
        'notifications.send',
    ];

    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (self::PERMISSIONS as $perm) {
            Permission::firstOrCreate([
                'name' => $perm,
                'guard_name' => 'web',
            ]);
        }

        $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $schoolAdmin = Role::firstOrCreate(['name' => 'school_admin', 'guard_name' => 'web']);
        $faculty = Role::firstOrCreate(['name' => 'faculty', 'guard_name' => 'web']);
        $parent = Role::firstOrCreate(['name' => 'parent', 'guard_name' => 'web']);

        $admin->syncPermissions(Permission::all());

        /** School admin (roles.pdf “Staff”): sections, enrollment, scheduling, analytics, forms/exports, violations — not system-wide admin tools. */
        $schoolAdmin->syncPermissions([
            'students.view',
            'students.create',
            'students.update',
            'students.delete',
            'students.import',
            'students.export',

            'enrollments.view',
            'enrollments.create',
            'enrollments.update',
            'enrollments.delete',

            'sections.view',
            'sections.create',
            'sections.update',
            'sections.delete',

            'subjects.view',
            'subjects.manage',

            'school_years.view',
            'grade_levels.view',

            'class_schedules.view',
            'class_schedules.manage',

            'violations.view',
            'violations.create',
            'violations.update',

            'reports.dashboard',
            'reports.analytics',
            'reports.sf1',
            'reports.sf2',
            'reports.sf3',
            'reports.sf4',
            'reports.sf5',
            'reports.form137',
            'reports.form138',
            'reports.pir',
            'reports.export',

            'notifications.view',
        ]);

        $faculty->syncPermissions([
            'students.view',
            'students.export',
            'enrollments.view',
            'sections.view',
            'subjects.view',
            'school_years.view',
            'grade_levels.view',
            'class_schedules.view',
            'grades.view',
            'grades.input',
            'grades.update',
            'attendance.view',
            'attendance.input',
            'attendance.update',
            'attendance.notify',
            'homeroom_guidance.view',
            'homeroom_guidance.input',
            'homeroom_guidance.update',
            'health.view',
            'health.input',
            'health.update',
            'violations.view',
            'violations.create',
            'violations.update',
            'reports.dashboard',
            'reports.sf1',
            'reports.sf2',
            'reports.form137',
            'reports.form138',
            'reports.pir',
            'reports.export',
            'notifications.view',
        ]);

        $parent->syncPermissions([
            'parent_portal.view',
            'notifications.view',
        ]);
    }
}
