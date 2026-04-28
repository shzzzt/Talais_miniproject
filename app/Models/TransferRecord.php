<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TransferRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'school_year_id',
        'transfer_type',
        'transfer_date',
        'quarter_at_transfer',
        'from_section_id',
        'to_section_id',
        'from_school',
        'to_school',
        'reason',
        'documents_received',
        'processed_by',
    ];

    protected $casts = [
        'transfer_date' => 'date',
        'documents_received' => 'array',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function schoolYear(): BelongsTo
    {
        return $this->belongsTo(SchoolYear::class);
    }

    public function fromSection(): BelongsTo
    {
        return $this->belongsTo(Section::class, 'from_section_id');
    }

    public function toSection(): BelongsTo
    {
        return $this->belongsTo(Section::class, 'to_section_id');
    }
}
