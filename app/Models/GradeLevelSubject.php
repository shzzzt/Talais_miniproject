<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\Pivot;

class GradeLevelSubject extends Pivot
{
    protected $table = 'grade_level_subjects';

    public $incrementing = true;

    protected $fillable = [
        'grade_level_id',
        'subject_id',
        'written_work_weight',
        'performance_task_weight',
        'quarterly_assessment_weight',
    ];

    protected $casts = [
        'written_work_weight' => 'decimal:2',
        'performance_task_weight' => 'decimal:2',
        'quarterly_assessment_weight' => 'decimal:2',
    ];

    public function gradeLevel(): BelongsTo
    {
        return $this->belongsTo(GradeLevel::class);
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }
}
