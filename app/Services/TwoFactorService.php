<?php

namespace App\Services;

use App\Models\User;
use App\Notifications\TwoFactorCodeNotification;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

/**
 * OTP based two-factor authentication helper.
 *
 * The cleartext code is sent via {@see TwoFactorCodeNotification}
 * while a hashed copy lives in cache for verification.
 */
class TwoFactorService
{
    public const CACHE_PREFIX = '2fa:';
    public const TTL_MINUTES = 10;

    public function dispatch(User $user): string
    {
        if (! $this->hasDeliveryDestination($user)) {
            throw new RuntimeException('Two-factor verification requires an email address or phone number.');
        }

        $code = (string) random_int(100000, 999999);

        Cache::put(
            self::CACHE_PREFIX.$user->id,
            Hash::make($code),
            now()->addMinutes(self::TTL_MINUTES),
        );

        try {
            $user->notify(new TwoFactorCodeNotification($code, self::TTL_MINUTES));
        } catch (Throwable $exception) {
            Cache::forget(self::CACHE_PREFIX.$user->id);
            Log::error('Unable to send two-factor verification code: '.$exception->getMessage(), [
                'user_id' => $user->id,
            ]);

            throw new RuntimeException('The verification code could not be sent. Please check the account email or phone number and try again.');
        }

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

    public function hasDeliveryDestination(User $user): bool
    {
        return filled($user->email)
            || filled($user->phone_number)
            || filled($user->contact_number ?? null)
            || filled($user->mobile ?? null);
    }
}
