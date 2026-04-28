<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Sf3BookRecord extends Model
{
    use HasFactory;

    protected $table = 'sf3_book_records';

    protected $fillable = [
        'enrollment_id',
        'subject_id',
        'book_title',
        'issued_date',
        'returned_date',
        'condition_on_issue',
        'condition_on_return',
        'remarks',
        'recorded_by',
    ];

    protected $casts = [
        'issued_date' => 'date',
        'returned_date' => 'date',
    ];

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class);
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }
}
