<?php

namespace App\Services;

use App\Models\User;
use App\Notifications\TwoFactorCodeNotification;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;

/**
 * Email-OTP based two-factor authentication helper.
 *
 * The cleartext code is emailed to the user via {@see TwoFactorCodeNotification}
 * while a hashed copy lives in cache for verification.
 */
class TwoFactorService
{
    public const CACHE_PREFIX = '2fa:';
    public const TTL_MINUTES = 10;

    public function dispatch(User $user): string
    {
        $code = (string) random_int(100000, 999999);

        Cache::put(
            self::CACHE_PREFIX.$user->id,
            Hash::make($code),
            now()->addMinutes(self::TTL_MINUTES),
        );

        $user->notify(new TwoFactorCodeNotification($code, self::TTL_MINUTES));

        return $code;
    }

    public function verify(User $user, string $code): bool
    {
        $hashed = Cache::get(self::CACHE_PREFIX.$user->id);

        if (! $hashed) {
            return false;
        }

        if (Hash::check($code, $hashed)) {
            Cache::forget(self::CACHE_PREFIX.$user->id);

            return true;
        }

        return false;
    }

    public function clear(User $user): void
    {
        Cache::forget(self::CACHE_PREFIX.$user->id);
    }
}
