<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Quarter extends Model
{
    use HasFactory;

    protected $fillable = [
        'school_year_id',
        'name',
        'quarter_number',
        'start_date',
        'end_date',
        'is_grading_open',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_grading_open' => 'boolean',
        'quarter_number' => 'integer',
    ];

    public function schoolYear(): BelongsTo
    {
        return $this->belongsTo(SchoolYear::class);
    }
}
