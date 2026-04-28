<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentHealthRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'school_year_id',
        'measurement_date',
        'weight_kg',
        'height_cm',
        'bmi',
        'bmi_classification',
        'is_feeding_program',
        'other_notes',
        'recorded_by',
    ];

    protected $casts = [
        'measurement_date' => 'date',
        'weight_kg' => 'decimal:2',
        'height_cm' => 'decimal:2',
        'bmi' => 'decimal:2',
        'is_feeding_program' => 'boolean',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function schoolYear(): BelongsTo
    {
        return $this->belongsTo(SchoolYear::class);
    }
}
