<?php

namespace App\Http\Requests\Auth;

use App\Models\User;
use App\Support\PhoneNumber;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    public const MAX_FAILED_ATTEMPTS = 5;

    public const LOCKOUT_MINUTES = 15;

    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'login' => ['required', 'string', 'max:191'],
            'password' => ['required', 'string'],
        ];
    }

    /**
     * Attempts authentication with TALAIS lockout policy:
     * - Tracks failed attempts on the user record (`failed_login_count`).
     * - Locks the account for {@see self::LOCKOUT_MINUTES} once the threshold is hit.
     * - Refuses inactive/suspended accounts (status check).
     *
     * @throws ValidationException
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        $user = $this->findUserByLoginIdentifier(trim((string) $this->input('login', '')));

        if ($user && $user->trashed()) {
            throw ValidationException::withMessages([
                'login' => 'This account has been deactivated. Contact the administrator.',
            ]);
        }

        if ($user && $user->isLocked()) {
            $minutes = max(1, $user->locked_until->diffInMinutes(now()));
            throw ValidationException::withMessages([
                'login' => "Account locked. Try again in {$minutes} minute(s).",
            ]);
        }

        if ($user && $user->status !== 'active') {
            throw ValidationException::withMessages([
                'login' => 'This account is not active. Contact the administrator.',
            ]);
        }

        if (! $user || ! Hash::check((string) $this->input('password'), $user->password)) {
            if ($user) {
                $user->forceFill([
                    'failed_login_count' => $user->failed_login_count + 1,
                ])->save();

                if ($user->failed_login_count >= self::MAX_FAILED_ATTEMPTS) {
                    $user->forceFill([
                        'locked_until' => Carbon::now()->addMinutes(self::LOCKOUT_MINUTES),
                    ])->save();
                }
            }

            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'login' => trans('auth.failed'),
            ]);
        }

        Auth::login($user, $this->boolean('remember'));

        $user->forceFill([
            'failed_login_count' => 0,
            'locked_until' => null,
            'last_login_at' => Carbon::now(),
            'last_login_ip' => $this->ip(),
        ])->save();

        RateLimiter::clear($this->throttleKey());
    }

    /**
     * @throws ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), self::MAX_FAILED_ATTEMPTS)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'login' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->string('login')).'|'.$this->ip());
    }

    private function findUserByLoginIdentifier(string $raw): ?User
    {
        if ($raw === '') {
            return null;
        }

        if (filter_var($raw, FILTER_VALIDATE_EMAIL)) {
            return User::withTrashed()
                ->where('email', strtolower($raw))
                ->first();
        }

        $phone = PhoneNumber::normalize($raw);
        if ($phone) {
            return User::withTrashed()->where('phone_number', $phone)->first();
        }

        return User::withTrashed()->where('email', $raw)->first();
    }
}
