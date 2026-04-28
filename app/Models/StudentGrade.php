<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class StudentGrade extends Model
{
    use HasFactory;
    use LogsActivity;

    protected $fillable = [
        'enrollment_id',
        'subject_id',
        'quarter_id',
        'written_work_ps',
        'performance_task_ps',
        'quarterly_assessment_ps',
        'quarterly_grade',
        'final_grade',
        'remarks',
        'is_locked',
        'validated_by',
        'validated_at',
        'encoded_by',
    ];

    protected $casts = [
        'written_work_ps' => 'decimal:2',
        'performance_task_ps' => 'decimal:2',
        'quarterly_assessment_ps' => 'decimal:2',
        'quarterly_grade' => 'decimal:2',
        'final_grade' => 'decimal:2',
        'is_locked' => 'boolean',
        'validated_at' => 'datetime',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()->logFillable()->logOnlyDirty();
    }

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class);
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function quarter(): BelongsTo
    {
        return $this->belongsTo(Quarter::class);
    }

    public function validatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'validated_by');
    }

    public function encodedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'encoded_by');
    }
}
