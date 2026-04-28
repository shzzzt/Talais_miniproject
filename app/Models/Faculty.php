<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Faculty extends Model
{
    use HasFactory;
    use LogsActivity;
    use SoftDeletes;

    protected $table = 'faculty';

    protected $fillable = [
        'user_id',
        'employee_id',
        'first_name',
        'middle_name',
        'last_name',
        'position',
        'specialization',
        'is_grade_level_chair',
        'grade_level_chair_of',
        'is_grade_level_head',
        'grade_level_head_of',
        'contact_number',
    ];

    protected $casts = [
        'is_grade_level_chair' => 'boolean',
        'is_grade_level_head' => 'boolean',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()->logFillable()->logOnlyDirty();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function gradeLevelChair(): BelongsTo
    {
        return $this->belongsTo(GradeLevel::class, 'grade_level_chair_of');
    }

    public function gradeLevelHead(): BelongsTo
    {
        return $this->belongsTo(GradeLevel::class, 'grade_level_head_of');
    }

    public function classSchedules(): HasMany
    {
        return $this->hasMany(ClassSchedule::class);
    }

    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->middle_name} {$this->last_name}");
    }
}
