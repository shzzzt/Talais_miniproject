<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Student extends Model
{
    use HasFactory;
    use LogsActivity;
    use SoftDeletes;

    protected $fillable = [
        'lrn',
        'first_name',
        'middle_name',
        'last_name',
        'suffix',
        'birth_date',
        'gender',
        'birth_place',
        'mother_tongue',
        'ip_ethnic_group',
        'religion',
        'house_street_sitio',
        'barangay',
        'municipality_city',
        'province',
        'birth_certificate_path',
        'status',
    ];

    protected $casts = [
        'birth_date' => 'date',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['lrn', 'first_name', 'middle_name', 'last_name', 'gender', 'status'])
            ->logOnlyDirty();
    }

    public function parents(): BelongsToMany
    {
        return $this->belongsToMany(ParentGuardian::class, 'student_parents', 'student_id', 'parent_id')
            ->withPivot('is_primary')
            ->withTimestamps();
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    public function currentEnrollment()
    {
        return $this->hasOne(Enrollment::class)
            ->whereHas('schoolYear', fn ($q) => $q->where('is_active', true));
    }

    public function healthRecords(): HasMany
    {
        return $this->hasMany(StudentHealthRecord::class);
    }

    public function violations(): HasMany
    {
        return $this->hasMany(StudentViolation::class);
    }

    public function transferRecords(): HasMany
    {
        return $this->hasMany(TransferRecord::class);
    }

    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->middle_name} {$this->last_name} {$this->suffix}");
    }

    public function getAgeAttribute(): ?int
    {
        return $this->birth_date?->age;
    }
}
