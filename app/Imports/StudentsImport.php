<?php

namespace App\Imports;

use App\Services\StudentEnrollmentService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\Importable;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class StudentsImport implements ToCollection, WithHeadingRow
{
    use Importable;

    public int $created = 0;
    public int $updated = 0;
    public array $errors = [];

    public function __construct(private readonly StudentEnrollmentService $service, private readonly ?int $userId = null)
    {
    }

    public function collection(Collection $rows): void
    {
        foreach ($rows as $index => $row) {
            $row = $row->toArray();

            try {
                DB::transaction(function () use ($row) {
                    $existing = ! empty($row['lrn'])
                        ? $this->service->findContinuingByLrn((string) $row['lrn'])
                        : null;

                    $genderRaw = strtolower(trim((string) ($row['gender'] ?? '')));
                    $gender = match ($genderRaw) {
                        'male', 'm' => 'Male',
                        'female', 'f' => 'Female',
                        default => ($row['gender'] ?? null) ? $row['gender'] : null,
                    };

                    $payload = [
                        'lrn' => $row['lrn'] ?? null,
                        'first_name' => $row['first_name'] ?? null,
                        'middle_name' => $row['middle_name'] ?? null,
                        'last_name' => $row['last_name'] ?? null,
                        'suffix' => $row['suffix'] ?? null,
                        'birthday' => $row['birthday'] ?? $row['birth_date'] ?? null,
                        'gender' => $gender,
                        'address' => $row['address'] ?? null,
                        'parent_name' => $row['parent_name'] ?? null,
                        'parent_contact' => $row['parent_contact'] ?? null,
                        'parent_email' => $row['parent_email'] ?? null,
                        'parent_relationship' => $row['parent_relationship'] ?? null,
                        'current_grade_level' => $row['grade_level'] ?? $row['current_grade_level'] ?? null,
                        'current_section_name' => $row['section'] ?? $row['current_section_name'] ?? null,
                        'enrollment_type' => $existing ? 'continuing' : ($row['enrollment_type'] ?? 'new'),
                        'status' => $row['status'] ?? 'enrolled',
                    ];

                    $this->service->createOrUpdateStudent($payload, $existing, $this->userId);

                    if ($existing) {
                        $this->updated++;
                    } else {
                        $this->created++;
                    }
                });
            } catch (\Throwable $e) {
                $this->errors[] = [
                    'row' => $index + 2,
                    'message' => $e->getMessage(),
                    'lrn' => $row['lrn'] ?? null,
                ];
            }
        }
    }
}
