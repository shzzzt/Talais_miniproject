<?php

namespace App\Http\Resources;

use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Denormalised student payload that emulates the legacy `Student` entity
 * shape consumed by the React UI (current_grade_level, parent_name, etc.)
 * while being backed by the normalised PostgreSQL schema.
 *
 * @mixin Student
 */
class StudentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $current = $this->whenLoaded('currentEnrollment', fn () => $this->currentEnrollment, fn () => $this->enrollments->sortByDesc('id')->first());
        $primaryParent = $this->relationLoaded('parents')
            ? ($this->parents->firstWhere('pivot.is_primary', true) ?? $this->parents->first())
            : null;

        $address = collect([
            $this->house_street_sitio,
            $this->barangay,
            $this->municipality_city,
            $this->province,
        ])->filter()->implode(', ');

        return [
            'id' => $this->id,
            'lrn' => $this->lrn,
            'first_name' => $this->first_name,
            'middle_name' => $this->middle_name,
            'last_name' => $this->last_name,
            'suffix' => $this->suffix,
            'gender' => $this->gender,
            'birth_date' => $this->birth_date?->toDateString(),
            'birthday' => $this->birth_date?->toDateString(),
            'birth_place' => $this->birth_place,
            'mother_tongue' => $this->mother_tongue,
            'ip_ethnic_group' => $this->ip_ethnic_group,
            'religion' => $this->religion,
            'house_street_sitio' => $this->house_street_sitio,
            'barangay' => $this->barangay,
            'municipality_city' => $this->municipality_city,
            'province' => $this->province,
            'address' => $address ?: null,
            'birth_certificate_path' => $this->birth_certificate_path,
            'status' => $this->status,
            'age' => $this->age,
            'full_name' => $this->full_name,
            'created_date' => $this->created_at?->toIso8601String(),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            'current_enrollment_id' => $current?->id,
            'current_grade_level_id' => $current?->grade_level_id,
            'current_grade_level' => $current?->gradeLevel?->name,
            'current_section_id' => $current?->section_id,
            'current_section_name' => $current?->section?->name,
            'school_year_id' => $current?->school_year_id,

            'parent_id' => $primaryParent?->id,
            'parent_name' => $primaryParent?->full_name,
            'parent_contact' => $primaryParent?->contact_number,
            'parent_email' => $primaryParent?->email,
            'parent_relationship' => $primaryParent?->relationship,
            'contact_number' => $primaryParent?->contact_number,
        ];
    }
}
