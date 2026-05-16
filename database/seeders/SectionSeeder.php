<?php

namespace Database\Seeders;

use App\Models\GradeLevel;
use App\Models\SchoolYear;
use App\Models\Section;
use App\Models\User;
use Illuminate\Database\Seeder;

class SectionSeeder extends Seeder
{
    /**
     * Two sections per grade level for the active (or newest) school year.
     *
     * @var array<string, array{0:string,1:string}> grade level name → [section_a, section_b]
     */
    protected const NAMES_BY_GRADE = [
        'Kindergarten 1' => ['Molave', 'Molave'],
        'Kindergarten 2' => ['Molave', 'Molave'],
        'Grade 1' => ['Rizal', 'Mabini'],
        'Grade 2' => ['Bonifacio', 'Luna'],
        'Grade 3' => ['Silang', 'Dela Rosa'],
        'Grade 4' => ['Jacinto', 'Agoncillo'],
        'Grade 5' => ['Burgos', 'Gomez'],
        'Grade 6' => ['Zamora', 'Aquino'],
    ];

    public function run(): void
    {
        $year = SchoolYear::query()->where('is_active', true)->first()
            ?? SchoolYear::query()->orderByDesc('start_date')->first();

        if (! $year) {
            $this->command?->warn('SectionSeeder: no school year found; skipping.');

            return;
        }

        $facultyUser = User::query()->where('role', 'faculty')->first();

        foreach (GradeLevel::query()->orderBy('level_order')->get() as $grade) {
            $pair = self::NAMES_BY_GRADE[$grade->name] ?? [''.$grade->name.' A', ''.$grade->name.' B'];
            foreach ($pair as $index => $name) {
                $usesSplit = $grade->usesSessionScheduling();
                $session = $usesSplit
                    ? ($index === 0 ? 'AM' : 'PM')
                    : 'whole_day';

                Section::firstOrCreate(
                    [
                        'school_year_id' => $year->id,
                        'grade_level_id' => $grade->id,
                        'name' => $name,
                        'session' => $session,
                    ],
                    [
                        'type' => $index === 0 ? 'cream' : 'regular',
                        'adviser_id' => $facultyUser?->id,
                        'max_capacity' => 40,
                    ]
                );
            }
        }

        $this->command?->info('SectionSeeder: sections ensured for '.$year->label);
    }
}
