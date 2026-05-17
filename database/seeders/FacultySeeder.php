<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Faculty;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class FacultySeeder extends Seeder
{
    /**
     * Sample faculty members with department assignments.
     *
     * @var list<array{email:string,name:string,employee_id:string,position:string,specialization:string,contact_number:string,department:?string}>
     */
    protected const SAMPLE_FACULTY = [
        [
            'email' => 'mrsvictoria.diaz@school.edu',
            'name' => 'Victoria Diaz',
            'employee_id' => 'EMP-2020-001',
            'position' => 'master_teacher_2',
            'specialization' => 'Mathematics Education',
            'contact_number' => '09171234567',
            'department' => 'Mathematics',
        ],
        [
            'email' => 'mrcarlo.santos@school.edu',
            'name' => 'Carlo Santos',
            'employee_id' => 'EMP-2020-002',
            'position' => 'teacher_1',
            'specialization' => 'Mathematics',
            'contact_number' => '09172345678',
            'department' => 'Mathematics',
        ],
        [
            'email' => 'mrsmariaelena.reyes@school.edu',
            'name' => 'Maria Elena Reyes',
            'employee_id' => 'EMP-2021-003',
            'position' => 'master_teacher_1',
            'specialization' => 'English Language Arts',
            'contact_number' => '09173456789',
            'department' => 'English',
        ],
        [
            'email' => 'mrsangelina.cruz@school.edu',
            'name' => 'Angelina Cruz',
            'employee_id' => 'EMP-2021-004',
            'position' => 'teacher_1',
            'specialization' => 'English Literature',
            'contact_number' => '09174567890',
            'department' => 'English',
        ],
        [
            'email' => 'drjose.marcos@school.edu',
            'name' => 'Jose Marcos',
            'employee_id' => 'EMP-2019-005',
            'position' => 'master_teacher_2',
            'specialization' => 'Science Education',
            'contact_number' => '09175678901',
            'department' => 'Science',
        ],
        [
            'email' => 'mrrodriguez.ana@school.edu',
            'name' => 'Ana Rodriguez',
            'employee_id' => 'EMP-2020-006',
            'position' => 'teacher_1',
            'specialization' => 'Biology',
            'contact_number' => '09176789012',
            'department' => 'Science',
        ],
        [
            'email' => 'mrslinda.fernandez@school.edu',
            'name' => 'Linda Fernandez',
            'employee_id' => 'EMP-2021-007',
            'position' => 'teacher_2',
            'specialization' => 'Physics',
            'contact_number' => '09177890123',
            'department' => 'Science',
        ],
        [
            'email' => 'mrrichard.torres@school.edu',
            'name' => 'Richard Torres',
            'employee_id' => 'EMP-2019-008',
            'position' => 'master_teacher_1',
            'specialization' => 'Social Studies',
            'contact_number' => '09178901234',
            'department' => 'Social Studies',
        ],
        [
            'email' => 'mrsyolanda.garcia@school.edu',
            'name' => 'Yolanda Garcia',
            'employee_id' => 'EMP-2020-009',
            'position' => 'teacher_1',
            'specialization' => 'World History',
            'contact_number' => '09179012345',
            'department' => 'Social Studies',
        ],
        [
            'email' => 'mrsrosalinda.lim@school.edu',
            'name' => 'Rosalinda Lim',
            'employee_id' => 'EMP-2021-010',
            'position' => 'master_teacher_2',
            'specialization' => 'Filipino Language & Culture',
            'contact_number' => '09180123456',
            'department' => 'Filipino',
        ],
        [
            'email' => 'mrjoseph.castro@school.edu',
            'name' => 'Joseph Castro',
            'employee_id' => 'EMP-2020-011',
            'position' => 'teacher_1',
            'specialization' => 'Filipino Literature',
            'contact_number' => '09181234567',
            'department' => 'Filipino',
        ],
        [
            'email' => 'mrdaniel.alvarez@school.edu',
            'name' => 'Daniel Alvarez',
            'employee_id' => 'EMP-2019-012',
            'position' => 'master_teacher_1',
            'specialization' => 'Physical Education & Health',
            'contact_number' => '09182345678',
            'department' => 'Physical Education & Health',
        ],
        [
            'email' => 'mrspatricia.sy@school.edu',
            'name' => 'Patricia Sy',
            'employee_id' => 'EMP-2021-013',
            'position' => 'teacher_1',
            'specialization' => 'Sports Science',
            'contact_number' => '09183456789',
            'department' => 'Physical Education & Health',
        ],
        [
            'email' => 'mrsmagdalena.santos@school.edu',
            'name' => 'Magdalena Santos',
            'employee_id' => 'EMP-2020-014',
            'position' => 'master_teacher_2',
            'specialization' => 'Arts & Technology',
            'contact_number' => '09184567890',
            'department' => 'Arts & Technology',
        ],
        [
            'email' => 'mrslucia.bautista@school.edu',
            'name' => 'Lucia Bautista',
            'employee_id' => 'EMP-2021-015',
            'position' => 'teacher_1',
            'specialization' => 'Visual Arts',
            'contact_number' => '09185678901',
            'department' => 'Arts & Technology',
        ],
        [
            'email' => 'mrsgregoria.moreno@school.edu',
            'name' => 'Gregoria Moreno',
            'employee_id' => 'EMP-2019-016',
            'position' => 'teacher_2',
            'specialization' => 'Technology & Innovation',
            'contact_number' => '09186789012',
            'department' => 'Arts & Technology',
        ],
        [
            'email' => 'mrsisabel.mercado@school.edu',
            'name' => 'Isabel Mercado',
            'employee_id' => 'EMP-2020-017',
            'position' => 'teacher_1',
            'specialization' => 'Elementary Education',
            'contact_number' => '09187890123',
            'department' => null,
        ],
        [
            'email' => 'mrjuan.parilla@school.edu',
            'name' => 'Juan Parilla',
            'employee_id' => 'EMP-2021-018',
            'position' => 'teacher_2',
            'specialization' => 'Early Childhood Education',
            'contact_number' => '09188901234',
            'department' => null,
        ],
    ];

    public function run(): void
    {
        foreach (self::SAMPLE_FACULTY as $data) {
            $email = $data['email'];
            unset($data['email']);
            $name = $data['name'];
            unset($data['name']);
            $department = $data['department'];
            unset($data['department']);

            // Create user with faculty role
            $user = User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    'password' => Hash::make('password'),
                    'role' => 'faculty',
                    'status' => 'active',
                    'email_verified_at' => now(),
                ]
            );

            if (! $user->hasRole('faculty')) {
                $user->syncRoles(['faculty']);
            }

            // Create faculty roster entry
            [$first, $last] = $this->splitName($name);

            $dept = null;
            if ($department) {
                $dept = Department::where('name', $department)->first()?->id;
            }

            Faculty::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'department_id' => $dept,
                    'first_name' => $first,
                    'last_name' => $last,
                    'middle_name' => '',
                    'employee_id' => $data['employee_id'],
                    'position' => $data['position'],
                    'specialization' => $data['specialization'],
                    'contact_number' => $data['contact_number'],
                    'is_grade_level_head' => str_starts_with($data['position'], 'master_teacher'),
                    'grade_level_head_of' => null,
                ]
            );
        }

        $this->command?->info('FacultySeeder: '.count(self::SAMPLE_FACULTY).' faculty members ensured.');
    }

    private function splitName(string $name): array
    {
        $parts = preg_split('/\s+/', trim($name), 2);

        return [
            $parts[0] ?? 'Faculty',
            $parts[1] ?? 'Member',
        ];
    }
}
