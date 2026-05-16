<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GradeLevel extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'level_order',
        'is_departmentalized',
        'has_session',
    ];

    protected $casts = [
        'level_order' => 'integer',
        'is_departmentalized' => 'boolean',
        'has_session' => 'boolean',
    ];

    public function sections(): HasMany
    {
        return $this->hasMany(Section::class);
    }

    public function gradeLevelSubjects(): HasMany
    {
        return $this->hasMany(GradeLevelSubject::class);
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    /**
     * Grades that split learners into morning (AM) vs afternoon (PM) sections (e.g. Kindergarten 1 & 2).
     */
    public function usesSessionScheduling(): bool
    {
        if ($this->has_session) {
            return true;
        }

        $name = mb_strtolower(trim($this->name));

        return $name === 'kindergarten 1' || $name === 'kindergarten 2';
    }
}
