<?php

namespace App\Models;

use Illuminate\Auth\MustVerifyEmail as MustVerifyEmailTrait;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasFactory;
    use HasRoles;
    use LogsActivity;
    use MustVerifyEmailTrait;
    use Notifiable;
    use SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone_number',
        'status',
        'avatar',
        'two_factor_secret',
        'two_factor_enabled',
        'last_login_at',
        'last_login_ip',
        'failed_login_count',
        'locked_until',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_enabled' => 'boolean',
            'last_login_at' => 'datetime',
            'locked_until' => 'datetime',
            'failed_login_count' => 'integer',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'email', 'role', 'status'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    public function faculty(): HasOne
    {
        return $this->hasOne(Faculty::class);
    }

    public function parentProfile(): HasOne
    {
        return $this->hasOne(ParentGuardian::class);
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isSchoolAdmin(): bool
    {
        return $this->role === 'school_admin';
    }

    public function isFaculty(): bool
    {
        return $this->role === 'faculty';
    }

    /**
     * True when this account is faculty per `users.role` or Spatie (keeps gates/UI working if roles are out of sync).
     */
    public function hasFacultyRole(): bool
    {
        return $this->role === 'faculty' || $this->hasRole('faculty');
    }

    public function hasAdminRole(): bool
    {
        return $this->role === 'admin' || $this->hasRole('admin');
    }

    public function hasSchoolAdminRole(): bool
    {
        return $this->role === 'school_admin' || $this->hasRole('school_admin');
    }

    public function hasParentRole(): bool
    {
        return $this->role === 'parent' || $this->hasRole('parent');
    }

    public function isParent(): bool
    {
        return $this->role === 'parent';
    }

    public function isLocked(): bool
    {
        return $this->locked_until && $this->locked_until->isFuture();
    }
}
