<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KeyPerformanceIndicator extends Model
{
    use HasFactory;

    protected $fillable = [
        'school_year_id',
        'indicator_name',
        'value',
        'formula_used',
        'grade_level_id',
        'computed_at',
        'computed_by',
    ];

    protected $casts = [
        'value' => 'decimal:4',
        'computed_at' => 'datetime',
    ];

    public function schoolYear(): BelongsTo
    {
        return $this->belongsTo(SchoolYear::class);
    }

    public function gradeLevel(): BelongsTo
    {
        return $this->belongsTo(GradeLevel::class);
    }
}
