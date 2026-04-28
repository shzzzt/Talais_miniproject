<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NatResult extends Model
{
    use HasFactory;

    protected $fillable = [
        'school_year_id',
        'subject_id',
        'grade_level_id',
        'mean_percentage_score',
        'number_of_takers',
        'proficiency_level',
        'remarks',
        'recorded_by',
    ];

    protected $casts = [
        'mean_percentage_score' => 'decimal:2',
        'number_of_takers' => 'integer',
    ];

    public function schoolYear(): BelongsTo
    {
        return $this->belongsTo(SchoolYear::class);
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function gradeLevel(): BelongsTo
    {
        return $this->belongsTo(GradeLevel::class);
    }
}
