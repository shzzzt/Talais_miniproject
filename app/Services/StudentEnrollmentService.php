<?php

namespace App\Services;

use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\ParentGuardian;
use App\Models\SchoolYear;
use App\Models\Section;
use App\Models\Student;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Translates the legacy denormalised Student payload (parent_name,
 * current_grade_level, ...) used by the React UI into the normalised
 * Student/ParentGuardian/Enrollment relations expected by the schema.
 */
class StudentEnrollmentService
{
    public function createOrUpdateStudent(array $payload, ?Student $existing = null, ?int $userId = null): Student
    {
        return DB::transaction(function () use ($payload, $existing, $userId) {
            $studentData = $this->extractStudentFields($payload);
            $student = $existing
                ? tap($existing)->fill($studentData)->save() && $existing->refresh()
                : Student::create($studentData);

            $student = $existing ?: $student;

            $this->syncPrimaryParent($student, $payload);
            $this->syncCurrentEnrollment($student, $payload, $userId);

            return $student->fresh(['currentEnrollment.gradeLevel', 'currentEnrollment.section', 'parents']);
        });
    }

    public function findContinuingByLrn(string $lrn): ?Student
    {
        return Student::with(['parents', 'currentEnrollment.gradeLevel', 'currentEnrollment.section', 'enrollments.gradeLevel'])
            ->where('lrn', $lrn)
            ->first();
    }

    private function extractStudentFields(array $payload): array
    {
        $birth = $payload['birth_date'] ?? $payload['birthday'] ?? null;
        $address = $payload['address'] ?? null;
        $house = $payload['house_street_sitio'] ?? null;
        $barangay = $payload['barangay'] ?? null;
        $municipality = $payload['municipality_city'] ?? null;
        $province = $payload['province'] ?? null;

        if ($address && ! $house && ! $barangay && ! $municipality && ! $province) {
            $parts = array_map('trim', explode(',', $address));
            $house = $parts[0] ?? null;
            $barangay = $parts[1] ?? null;
            $municipality = $parts[2] ?? null;
            $province = $parts[3] ?? null;
        }

        return array_filter([
            'lrn' => $payload['lrn'] ?? null,
            'first_name' => $payload['first_name'] ?? null,
            'middle_name' => $payload['middle_name'] ?? null,
            'last_name' => $payload['last_name'] ?? null,
            'suffix' => $payload['suffix'] ?? null,
            'birth_date' => $birth,
            'gender' => $payload['gender'] ?? null,
            'birth_place' => $payload['birth_place'] ?? null,
            'mother_tongue' => $payload['mother_tongue'] ?? null,
            'ip_ethnic_group' => $payload['ip_ethnic_group'] ?? null,
            'religion' => $payload['religion'] ?? null,
            'house_street_sitio' => $house,
            'barangay' => $barangay,
            'municipality_city' => $municipality,
            'province' => $province,
            'birth_certificate_path' => $payload['birth_certificate_path'] ?? null,
            'status' => $payload['status'] ?? 'enrolled',
        ], fn ($v) => $v !== null && $v !== '');
    }

    private function syncPrimaryParent(Student $student, array $payload): void
    {
        $parentName = $payload['parent_name'] ?? null;
        $parentContact = $payload['parent_contact'] ?? null;
        $parentEmail = $payload['parent_email'] ?? null;
        $parentRelationship = $payload['parent_relationship'] ?? 'Other';
        if (! $parentName) {
            return;
        }

        $segments = preg_split('/\s+/', trim($parentName), 3) ?: [];
        $first = $segments[0] ?? $parentName;
        $middle = isset($segments[2]) ? $segments[1] : null;
        $last = $segments[2] ?? ($segments[1] ?? '');

        $parent = ParentGuardian::query()
            ->where('first_name', $first)
            ->where('last_name', $last)
            ->when($parentContact, fn ($q) => $q->orWhere('contact_number', $parentContact))
            ->first();

        $parent = $parent ?: new ParentGuardian();
        $parent->fill([
            'first_name' => $first,
            'middle_name' => $middle,
            'last_name' => $last,
            'relationship' => in_array($parentRelationship, ['Father', 'Mother', 'Legal Guardian', 'Other'], true)
                ? $parentRelationship
                : 'Other',
            'contact_number' => $parentContact,
            'email' => $parentEmail,
        ]);
        $parent->save();

        $student->parents()->syncWithoutDetaching([
            $parent->id => ['is_primary' => true],
        ]);
    }

    private function syncCurrentEnrollment(Student $student, array $payload, ?int $userId): void
    {
        $gradeLabel = $payload['current_grade_level'] ?? null;
        $sectionId = $payload['current_section_id'] ?? null;
        $sectionName = $payload['current_section_name'] ?? null;
        $year = SchoolYear::active() ?? SchoolYear::orderByDesc('id')->first();
        if (! $year || ! $gradeLabel) {
            return;
        }

        $gradeLevel = GradeLevel::where('name', $gradeLabel)
            ->orWhere('name', 'ILIKE', $gradeLabel)
            ->first();
        if (! $gradeLevel) {
            return;
        }

        $section = null;
        if ($sectionId) {
            $section = Section::find($sectionId);
        } elseif ($sectionName) {
            $section = Section::firstOrCreate(
                [
                    'school_year_id' => $year->id,
                    'grade_level_id' => $gradeLevel->id,
                    'name' => $sectionName,
                ],
                [
                    'type' => 'regular',
                    'session' => 'whole_day',
                    'max_capacity' => 40,
                ],
            );
        }

        $enrollment = Enrollment::firstOrNew([
            'student_id' => $student->id,
            'school_year_id' => $year->id,
        ]);
        $enrollment->fill([
            'grade_level_id' => $gradeLevel->id,
            'section_id' => $section?->id,
            'enrollment_date' => $payload['enrollment_date'] ?? now()->toDateString(),
            'enrollment_type' => $payload['enrollment_type'] ?? ($enrollment->exists ? $enrollment->enrollment_type : 'new'),
            'status' => $payload['status'] ?? 'enrolled',
            'learning_modality' => $payload['learning_modality'] ?? 'face_to_face',
            'is_summer_class' => (bool) ($payload['is_summer_class'] ?? false),
            'enrolled_by' => $userId,
        ]);
        $enrollment->save();
    }
}
