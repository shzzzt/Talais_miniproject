<?php

namespace Database\Seeders;

use App\Models\GradeLevel;
use App\Models\Quarter;
use App\Models\SchoolYear;
use App\Models\Subject;
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
            ['name' => 'Grade 7', 'level_order' => 7, 'is_departmentalized' => true],
            ['name' => 'Grade 8', 'level_order' => 8, 'is_departmentalized' => true],
            ['name' => 'Grade 9', 'level_order' => 9, 'is_departmentalized' => true],
            ['name' => 'Grade 10', 'level_order' => 10, 'is_departmentalized' => true],
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

        $subjects = [
            ['code' => 'FIL', 'name' => 'Filipino', 'minutes_per_day' => 50],
            ['code' => 'ENG', 'name' => 'English', 'minutes_per_day' => 50],
            ['code' => 'MATH', 'name' => 'Mathematics', 'minutes_per_day' => 50],
            ['code' => 'SCI', 'name' => 'Science', 'minutes_per_day' => 50],
            ['code' => 'AP', 'name' => 'Araling Panlipunan', 'minutes_per_day' => 40],
            ['code' => 'ESP', 'name' => 'Edukasyon sa Pagpapakatao', 'minutes_per_day' => 40],
            ['code' => 'MAPEH', 'name' => 'MAPEH', 'minutes_per_day' => 40],
            ['code' => 'TLE', 'name' => 'Technology and Livelihood Education', 'minutes_per_day' => 40],
            ['code' => 'MTB', 'name' => 'Mother Tongue', 'minutes_per_day' => 50],
        ];
        foreach ($subjects as $s) {
            Subject::firstOrCreate(['code' => $s['code']], $s);
        }
    }
}
