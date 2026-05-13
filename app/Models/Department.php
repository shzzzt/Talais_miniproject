<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Department extends Model
{
    protected $fillable = [
        'name',
    ];

    public function assignments(): HasMany
    {
        return $this->hasMany(DepartmentSubjectTeacher::class);
    }

    public function facultyRoster(): HasMany
    {
        return $this->hasMany(Faculty::class, 'department_id');
    }

    public function subjects(): HasMany
    {
        return $this->hasMany(Subject::class, 'department_id');
    }
}
