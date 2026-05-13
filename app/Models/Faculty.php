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

    /**
     * Create or update an HR roster row for accounts with the faculty role.
     *
     * @param  array{department_id?: int|null}  $options  If `department_id` key is present, it is written (nullable).
     */
    public static function ensureRosterRowForFacultyUser(User $user, array $options = []): ?self
    {
        if (! $user->hasFacultyRole()) {
            return null;
        }

        $touchDepartment = array_key_exists('department_id', $options);
        $departmentId = $touchDepartment ? $options['department_id'] : null;

        $existing = static::query()->where('user_id', $user->id)->first();
        if ($existing) {
            if ($touchDepartment) {
                $existing->update(['department_id' => $departmentId]);
            }

            return $existing;
        }

        [$first, $last] = self::splitDisplayNameForRoster($user->name ?? '');

        return static::create([
            'user_id' => $user->id,
            'department_id' => $touchDepartment ? $departmentId : null,
            'first_name' => $first,
            'last_name' => $last,
            'middle_name' => null,
            'employee_id' => null,
            'position' => null,
            'specialization' => null,
            'contact_number' => $user->phone_number,
            'is_grade_level_head' => false,
            'grade_level_head_of' => null,
        ]);
    }

    /**
     * @return array{0: string, 1: string}
     */
    private static function splitDisplayNameForRoster(string $name): array
    {
        $name = trim($name);
        if ($name === '') {
            return ['Faculty', 'Member'];
        }

        $parts = preg_split('/\s+/u', $name, 2, PREG_SPLIT_NO_EMPTY) ?: [];

        $first = $parts[0] ?? 'Faculty';
        $last = $parts[1] ?? 'Member';

        return [$first, $last];
    }

    protected $fillable = [
        'user_id',
        'department_id',
        'employee_id',
        'first_name',
        'middle_name',
        'last_name',
        'position',
        'specialization',
        'is_grade_level_head',
        'grade_level_head_of',
        'contact_number',
    ];

    protected $casts = [
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

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
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
