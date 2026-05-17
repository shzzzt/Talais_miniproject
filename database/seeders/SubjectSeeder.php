<?php

namespace Database\Seeders;

use App\Models\GradeLevel;
use App\Models\Subject;
use Illuminate\Database\Seeder;

class SubjectSeeder extends Seeder
{
    /**
     * Core catalog unique by `subjects.code`.
     *
     * @var list<array{code:string,name:string,minutes_per_day:int}>
     */
    public const CORE_SUBJECTS = [
        ['code' => 'FIL', 'name' => 'Filipino', 'minutes_per_day' => 50],
        ['code' => 'ENG', 'name' => 'English', 'minutes_per_day' => 50],
        ['code' => 'MATH', 'name' => 'Mathematics', 'minutes_per_day' => 50],
        ['code' => 'SCI', 'name' => 'Science', 'minutes_per_day' => 50],
        ['code' => 'AP', 'name' => 'Araling Panlipunan', 'minutes_per_day' => 40],
        ['code' => 'ESP', 'name' => 'Edukasyon sa Pagpapakatao', 'minutes_per_day' => 40],
        ['code' => 'MAPEH', 'name' => 'MAPEH', 'minutes_per_day' => 40],
        ['code' => 'TLE', 'name' => 'Technology and Livelihood Education', 'minutes_per_day' => 40],        ['code' => 'MTB', 'name' => 'Mother Tongue', 'minutes_per_day' => 50],
    ];

    /** @var array<string, string> Pivot weights (matches migration defaults) */
    protected const WEIGHT_DEFAULTS = [
        'written_work_weight' => '30',
        'performance_task_weight' => '50',
        'quarterly_assessment_weight' => '20',
    ];

    public function run(): void
    {
        foreach (self::CORE_SUBJECTS as $row) {
            Subject::updateOrCreate(['code' => $row['code']], $row);
        }

        $this->syncGradeLevelSubjects();
        $this->createGradeLevel46SpecializedSubjects();
        $this->assignDepartmentsToGrades46Only();

        $this->command?->info('SubjectSeeder: core subjects, specialized subjects (grades 4-6), and departments ensured.');
    }

    private function syncGradeLevelSubjects(): void
    {
        foreach (GradeLevel::query()->orderBy('level_order')->get() as $grade) {
            $lod = (int) $grade->level_order;

            $codes = match (true) {
                $lod === 0 => ['MTB', 'FIL', 'ENG', 'MATH', 'MAPEH'],
                default => ['MTB', 'FIL', 'ENG', 'MATH', 'SCI', 'AP', 'ESP', 'MAPEH', 'TLE'],
            };

            foreach ($codes as $code) {
                $subject = Subject::query()->where('code', $code)->first();

                if (! $subject) {
                    continue;
                }

                if ($subject->gradeLevels()->whereKey($grade->id)->exists()) {
                    continue;
                }

                $subject->gradeLevels()->attach($grade->id, self::WEIGHT_DEFAULTS);
            }
        }
    }

    private function createGradeLevel46SpecializedSubjects(): void
    {
        // NEW subjects for Grades 4-6 ONLY with departments
        $specializedSubjects = [
            ['code' => 'ICT', 'name' => 'Information & Communication Technology', 'minutes_per_day' => 40, 'department' => 'Arts & Technology'],
            ['code' => 'MUS', 'name' => 'Music', 'minutes_per_day' => 40, 'department' => 'Physical Education & Health'],
            ['code' => 'VA', 'name' => 'Visual Arts', 'minutes_per_day' => 40, 'department' => 'Arts & Technology'],
            ['code' => 'PE', 'name' => 'Physical Education', 'minutes_per_day' => 40, 'department' => 'Physical Education & Health'],
            ['code' => 'HE', 'name' => 'Health Education', 'minutes_per_day' => 40, 'department' => 'Physical Education & Health'],
        ];

        $grades46 = GradeLevel::query()
            ->whereIn('name', ['Grade 4', 'Grade 5', 'Grade 6'])
            ->orderBy('level_order')
            ->get();

        foreach ($specializedSubjects as $subjectData) {
            $department = $subjectData['department'];
            unset($subjectData['department']);

            // Create or update the subject
            $subject = Subject::updateOrCreate(
                ['code' => $subjectData['code']],
                $subjectData
            );

            // Attach to grades 4-6 only
            foreach ($grades46 as $grade) {
                if (! $subject->gradeLevels()->whereKey($grade->id)->exists()) {
                    $subject->gradeLevels()->attach($grade->id, self::WEIGHT_DEFAULTS);
                }
            }

            // Assign department immediately for these specialized subjects
            $dept = \App\Models\Department::where('name', $department)->first();
            if ($dept) {
                $subject->update(['department_id' => $dept->id]);
            }
        }
    }

    private function assignDepartmentsToGrades46Only(): void
    {
        // Department mapping for subject codes - ONLY for grades 4-6
        $deptMap = [
            'MATH' => 'Mathematics',
            'ENG' => 'English',
            'SCI' => 'Science',
            'AP' => 'Social Studies',
            'FIL' => 'Filipino',
            'MAPEH' => 'Physical Education & Health',
            'TLE' => 'Arts & Technology',
            'ESP' => null, // Values education - no department
            'MTB' => null, // Mother tongue - no department
        ];

        $grades46 = GradeLevel::query()
            ->whereIn('name', ['Grade 4', 'Grade 5', 'Grade 6'])
            ->pluck('id')
            ->toArray();

        foreach ($deptMap as $code => $deptName) {
            if (! $deptName) {
                continue;
            }

            $subject = Subject::query()->where('code', $code)->first();
            if (! $subject) {
                continue;
            }

            // Only assign department if subject is taught in grades 4-6
            $isInGrades46 = $subject->gradeLevels()
                ->whereIn('grade_levels.id', $grades46)
                ->exists();

            if ($isInGrades46) {
                $dept = \App\Models\Department::where('name', $deptName)->first();
                if ($dept) {
                    $subject->update(['department_id' => $dept->id]);
                }
            } else {
                // Ensure K-3 subjects have NO department
                $subject->update(['department_id' => null]);
            }
        }
    }
}
