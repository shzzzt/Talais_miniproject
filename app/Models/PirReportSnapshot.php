<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PirReportSnapshot extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'school_year_id',
        'faculty_id',
        'section_id',
        'report_month',
        'report_year',
        'jan_enrolment_m',
        'jan_enrolment_f',
        'transferred_in_m',
        'transferred_in_f',
        'transferred_in_reason',
        'transferred_out_m',
        'transferred_out_f',
        'transferred_out_reason',
        'dropped_out_m',
        'dropped_out_f',
        'dropped_out_reason',
        'lardo_m',
        'lardo_f',
        'lardo_reason',
        'overage_m',
        'overage_f',
        'ip_learners_m',
        'ip_learners_f',
        'fourps_ctt_m',
        'fourps_ctt_f',
        'alive_learners_m',
        'alive_learners_f',
        'generated_by',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function schoolYear(): BelongsTo
    {
        return $this->belongsTo(SchoolYear::class);
    }

    public function faculty(): BelongsTo
    {
        return $this->belongsTo(Faculty::class);
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class);
    }
}
