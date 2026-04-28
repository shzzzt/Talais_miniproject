<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GradeReviewAssignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'school_year_id',
        'assigned_by',
        'reviewer_faculty_id',
        'reviewee_faculty_id',
        'section_id',
        'quarter_id',
        'status',
        'reviewed_at',
        'remarks',
    ];

    protected $casts = [
        'reviewed_at' => 'datetime',
    ];

    public function schoolYear(): BelongsTo
    {
        return $this->belongsTo(SchoolYear::class);
    }

    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(Faculty::class, 'reviewer_faculty_id');
    }

    public function reviewee(): BelongsTo
    {
        return $this->belongsTo(Faculty::class, 'reviewee_faculty_id');
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class);
    }

    public function quarter(): BelongsTo
    {
        return $this->belongsTo(Quarter::class);
    }
}
