<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subject extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'minutes_per_day',
        'department_id',
    ];

    protected $casts = [
        'minutes_per_day' => 'integer',
    ];

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function gradeLevels(): BelongsToMany
    {
        return $this->belongsToMany(GradeLevel::class, 'grade_level_subjects')
            ->using(GradeLevelSubject::class)
            ->withPivot(['written_work_weight', 'performance_task_weight', 'quarterly_assessment_weight'])
            ->withTimestamps();
    }

    public function gradeLevelSubjects(): HasMany
    {
        return $this->hasMany(GradeLevelSubject::class);
    }

    public function classSchedules(): HasMany
    {
        return $this->hasMany(ClassSchedule::class);
    }
}
