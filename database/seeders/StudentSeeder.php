<?php

namespace Database\Seeders;

use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\ParentGuardian;
use App\Models\SchoolYear;
use App\Models\Section;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Seeder;

class StudentSeeder extends Seeder
{
    /** @var list<array{first:string,middle:?string,last:string,gender:string}> */
    protected const SAMPLE_LEARNERS = [
        ['first' => 'Ana Marie', 'middle' => null, 'last' => 'Santos', 'gender' => 'Female'],
        ['first' => 'Miguel', 'middle' => 'Joseph', 'last' => 'Reyes', 'gender' => 'Male'],
        ['first' => 'Liza Mae', 'middle' => null, 'last' => 'Cruz', 'gender' => 'Female'],
        ['first' => 'Carlo', 'middle' => 'P.', 'last' => 'Bernardo', 'gender' => 'Male'],
        ['first' => 'Keisha Anne', 'middle' => null, 'last' => 'Aquino', 'gender' => 'Female'],
        ['first' => 'John Paul', 'middle' => null, 'last' => 'Mercado', 'gender' => 'Male'],
        ['first' => 'Sofia', 'middle' => 'Rose', 'last' => 'Fernandez', 'gender' => 'Female'],
        ['first' => 'Marc Daniel', 'middle' => null, 'last' => 'Tolentino', 'gender' => 'Male'],
    ];

    /** @var list<array{barangay:string,municipality:string,house_street:string}> */
    protected const SAMPLE_ADDRESSES = [
        ['barangay' => 'Musuan', 'municipality' => 'Bukidnon', 'house_street' => '123 Pag-asa St.'],
        ['barangay' => 'Purok 1', 'municipality' => 'Bukidnon', 'house_street' => '456 Sampaguita Ave.'],
        ['barangay' => 'Purok 2', 'municipality' => 'Bukidnon', 'house_street' => '789 Dahlia Ln.'],
        ['barangay' => 'Purok 3', 'municipality' => 'Bukidnon', 'house_street' => '321 Ilalim St.'],
        ['barangay' => 'Purok 4', 'municipality' => 'Bukidnon', 'house_street' => '654 Kalamansi Rd.'],
        ['barangay' => 'Purok 5', 'municipality' => 'Bukidnon', 'house_street' => '987 Langka St.'],
    ];

    protected const RELIGION_VALUES = ['Roman Catholic', 'Protestant', 'Evangelical', 'Seventh-day Adventist', 'Islam'];
    protected const MOTHER_TONGUE_VALUES = ['Cebuano', 'Tagalog', 'English', 'Chavacano', 'Bisaya'];

    /** @var list<string> Elementary + JHS-ish grades used for synthetic enrollments */
    protected const EXTRA_GRADE_NAMES = [
        'Kindergarten',        'Grade 1',
        'Grade 2',
        'Grade 3',
        'Grade 4',
        'Grade 5',
        'Grade 6',
    ];

    private function year(): ?SchoolYear
    {
        return SchoolYear::query()->where('is_active', true)->first()
            ?? SchoolYear::query()->orderByDesc('start_date')->first();
    }

    /**
     * Idempotent pseudo-LRN (12-digit) keyed by grade + row index for re-seeding.
     */
    private function deterministicBulkLrn(GradeLevel $grade, int $rowIndex): string
    {
        return sprintf(
            '799791%02d%04d',
            ((int) $grade->level_order) % 100,
            ($rowIndex + (int) $grade->id * 151) % 10000,
        );
    }

    /** Birth dates spread by grade level order (younger kindergarten). */
    private function birthDateForGrade(GradeLevel $grade): string
    {
        $yearsAgo = 5 + max(0, (int) $grade->level_order);

        return now()->subYears($yearsAgo)->subMonths(3)->format('Y-m-d');
    }

    public function run(): void
    {
        $year = $this->year();
        if (! $year) {
            $this->command?->warn('StudentSeeder: no school year found; skipping.');

            return;
        }

        $admin = User::query()->where('role', 'admin')->first();

        $this->ensureDemoEnrollment($year, $admin?->id);
        $this->seedDistributedLearners($year, $admin?->id);

        $this->command?->info('StudentSeeder: demo + sample learners ensured for '.$year->label);
    }

    private function ensureDemoEnrollment(SchoolYear $year, ?int $enrolledById): void
    {
        $g1 = GradeLevel::where('name', 'Grade 1')->first();
        $parentUser = User::query()->where('email', 'parent@talais.test')->first();
        $facultyUser = User::query()->where('role', 'faculty')->first();

        if ($g1) {
            $section = Section::firstOrCreate(
                [
                    'school_year_id' => $year->id,
                    'grade_level_id' => $g1->id,
                    'name' => 'Rizal',
                ],
                [
                    'type' => 'regular',
                    'session' => 'whole_day',
                    'adviser_id' => $facultyUser?->id,
                    'max_capacity' => 40,
                ]
            );

            $addr = self::SAMPLE_ADDRESSES[0];
            $demoStudent = Student::updateOrCreate(
                ['lrn' => '136012345678'],
                [
                    'first_name' => 'Juan',
                    'middle_name' => 'Miguel',
                    'last_name' => 'Dela Cruz',
                    'birth_date' => '2017-03-15',
                    'birth_place' => 'Cagayan de Oro City',
                    'gender' => 'Male',
                    'mother_tongue' => 'Cebuano',
                    'religion' => 'Roman Catholic',
                    'house_street_sitio' => $addr['house_street'],
                    'barangay' => $addr['barangay'],
                    'municipality_city' => $addr['municipality'],
                    'province' => 'Bukidnon',
                    'status' => 'enrolled',
                ]
            );

            Enrollment::firstOrCreate(
                [
                    'student_id' => $demoStudent->id,
                    'school_year_id' => $year->id,
                ],
                [
                    'grade_level_id' => $g1->id,
                    'section_id' => $section->id,
                    'enrollment_date' => now()->toDateString(),
                    'enrollment_type' => 'new',
                    'status' => 'enrolled',
                    'enrolled_by' => $enrolledById,
                ]
            );

            if ($parentUser) {
                $guardian = ParentGuardian::firstOrCreate(
                    ['user_id' => $parentUser->id],
                    [
                        'first_name' => 'Maria',
                        'middle_name' => 'Santos',
                        'last_name' => 'Dela Cruz',
                        'relationship' => 'Mother',
                        'contact_number' => '09171234567',
                        'email' => 'parent@talais.test',
                        'house_street_sitio' => $addr['house_street'],
                        'barangay' => $addr['barangay'],
                        'municipality_city' => $addr['municipality'],
                        'province' => 'Bukidnon',
                        'mother_tongue' => 'Cebuano',
                        'religion' => 'Roman Catholic',
                    ]
                );

                if (! $guardian->students()->where('students.id', $demoStudent->id)->exists()) {
                    $guardian->students()->attach($demoStudent->id, ['is_primary' => true]);
                }
            }
        }
    }

    private function seedDistributedLearners(SchoolYear $year, ?int $enrolledById): void
    {
        $grades = GradeLevel::query()
            ->whereIn('name', self::EXTRA_GRADE_NAMES)
            ->orderBy('level_order')
            ->get();

        $nameIdx = 0;
        foreach ($grades as $grade) {
            $sections = Section::query()
                ->where('school_year_id', $year->id)
                ->where('grade_level_id', $grade->id)
                ->orderBy('id')
                ->get();

            $perGrade = match ($grade->name) {
                'Kindergarten', 'Grade 1' => 6,                'Grade 6' => 4,
                default => 5,
            };

            for ($i = 0; $i < $perGrade; $i++) {
                $learnerDef = self::SAMPLE_LEARNERS[$nameIdx % count(self::SAMPLE_LEARNERS)];
                $addr = self::SAMPLE_ADDRESSES[$i % count(self::SAMPLE_ADDRESSES)];
                $religion = self::RELIGION_VALUES[$i % count(self::RELIGION_VALUES)];
                $motherTongue = self::MOTHER_TONGUE_VALUES[$nameIdx % count(self::MOTHER_TONGUE_VALUES)];
                $nameIdx++;

                $lrn = $this->deterministicBulkLrn($grade, $i);

                $student = Student::updateOrCreate(
                    ['lrn' => $lrn],
                    [
                        'first_name' => $learnerDef['first'],
                        'middle_name' => $learnerDef['middle'] ?? '',
                        'last_name' => $learnerDef['last'],
                        'birth_date' => $this->birthDateForGrade($grade),
                        'birth_place' => 'Bukidnon',
                        'gender' => $learnerDef['gender'],
                        'mother_tongue' => $motherTongue,
                        'religion' => $religion,
                        'house_street_sitio' => $addr['house_street'],
                        'barangay' => $addr['barangay'],
                        'municipality_city' => $addr['municipality'],
                        'province' => 'Bukidnon',
                        'status' => 'enrolled',
                    ]
                );

                $assignedSection = $sections->isEmpty()
                    ? null
                    : $sections[$i % $sections->count()];

                /** One learner per grade stays unassigned (section assignment QA). */
                if ($sections->isNotEmpty() && $perGrade >= 2 && $i === $perGrade - 2) {
                    $assignedSection = null;
                }

                $classSession = null;
                if ($assignedSection && $grade->usesSessionScheduling() && in_array($assignedSection->session, ['AM', 'PM'], true)) {
                    $classSession = $assignedSection->session;
                }

                $status = $assignedSection === null ? 'pending' : 'enrolled';

                Enrollment::firstOrCreate(
                    [
                        'student_id' => $student->id,
                        'school_year_id' => $year->id,
                    ],
                    [
                        'grade_level_id' => $grade->id,
                        'section_id' => $assignedSection?->id,
                        'class_session' => $classSession,
                        'enrollment_date' => now()->toDateString(),
                        'enrollment_type' => 'new',
                        'status' => $status,
                        'enrolled_by' => $enrolledById,
                    ]
                );
            }
        }
    }
}
