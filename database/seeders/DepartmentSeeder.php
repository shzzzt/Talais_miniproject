<?php

namespace Database\Seeders;

use App\Models\Department;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    /**
     * Departments for departmentalized grades (4-6).
     * Subjects and faculty will assign themselves to these departments.
     *
     * @var list<array{name:string}>
     */
    protected const DEPARTMENTS = [
        ['name' => 'Mathematics'],
        ['name' => 'English'],
        ['name' => 'Science'],
        ['name' => 'Social Studies'],
        ['name' => 'Filipino'],
        ['name' => 'Physical Education & Health'],
        ['name' => 'Arts & Technology'],
    ];

    public function run(): void
    {
        foreach (self::DEPARTMENTS as $dept) {
            Department::firstOrCreate(['name' => $dept['name']], $dept);
        }

        $this->command?->info('DepartmentSeeder: '.count(self::DEPARTMENTS).' departments ensured.');
    }
}
