<?php

namespace Database\Seeders;

use App\Models\GradeLevel;
use App\Models\Quarter;
use App\Models\SchoolYear;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RolePermissionSeeder::class,
        ]);

        $admin = User::firstOrCreate(
            ['email' => 'admin@talais.test'],
            [
                'name' => 'TALAIS Administrator',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );
        $admin->syncRoles(['admin']);

        $faculty = User::firstOrCreate(
            ['email' => 'faculty@talais.test'],
            [
                'name' => 'Sample Faculty',
                'password' => Hash::make('password'),
                'role' => 'faculty',
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );
        $faculty->syncRoles(['faculty']);

        $schoolAdmin = User::firstOrCreate(
            ['email' => 'schooladmin@talais.test'],
            [
                'name' => 'Sample School Admin',
                'password' => Hash::make('password'),
                'role' => 'school_admin',
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );
        $schoolAdmin->syncRoles(['school_admin']);

        $parent = User::firstOrCreate(
            ['email' => 'parent@talais.test'],
            [
                'name' => 'Sample Parent',
                'password' => Hash::make('password'),
                'role' => 'parent',
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );
        $parent->syncRoles(['parent']);

        $sy = SchoolYear::firstOrCreate(
            ['label' => '2025-2026'],
            [
                'start_date' => '2025-08-25',
                'end_date' => '2026-06-12',
                'is_active' => true,
            ]
        );

        SchoolYear::where('id', '!=', $sy->id)->update(['is_active' => false]);

        $gradeLevels = [
            ['name' => 'Kindergarten', 'level_order' => 0, 'is_departmentalized' => false, 'has_session' => true],
            ['name' => 'Grade 1', 'level_order' => 1, 'is_departmentalized' => false],
            ['name' => 'Grade 2', 'level_order' => 2, 'is_departmentalized' => false],
            ['name' => 'Grade 3', 'level_order' => 3, 'is_departmentalized' => false],
            ['name' => 'Grade 4', 'level_order' => 4, 'is_departmentalized' => false],
            ['name' => 'Grade 5', 'level_order' => 5, 'is_departmentalized' => false],
            ['name' => 'Grade 6', 'level_order' => 6, 'is_departmentalized' => false],
        ];
        foreach ($gradeLevels as $gl) {
            GradeLevel::firstOrCreate(['name' => $gl['name']], $gl);
        }

        $quarterRanges = [
            1 => ['name' => '1st Quarter', 'start' => '2025-08-25', 'end' => '2025-10-31'],
            2 => ['name' => '2nd Quarter', 'start' => '2025-11-03', 'end' => '2026-01-30'],
            3 => ['name' => '3rd Quarter', 'start' => '2026-02-02', 'end' => '2026-04-10'],
            4 => ['name' => '4th Quarter', 'start' => '2026-04-13', 'end' => '2026-06-12'],
        ];
        foreach ($quarterRanges as $qNum => $range) {
            Quarter::firstOrCreate(
                ['school_year_id' => $sy->id, 'quarter_number' => $qNum],
                [
                    'name' => $range['name'],
                    'start_date' => $range['start'],
                    'end_date' => $range['end'],
                    'is_grading_open' => $qNum === 1,
                ]
            );
        }

        $this->call([
            SubjectSeeder::class,
            DepartmentSeeder::class,
            FacultySeeder::class,
            SectionSeeder::class,
            StudentSeeder::class,
        ]);
    }
}
