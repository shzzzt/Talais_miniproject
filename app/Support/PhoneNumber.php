<?php

namespace App\Support;

final class PhoneNumber
{
    /**
     * Normalize to digits for storage and lookup (Philippines: +63 / 63 → leading 0).
     */
    public static function normalize(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $trimmed = trim($value);
        if ($trimmed === '') {
            return null;
        }

        $digits = preg_replace('/\D+/', '', $trimmed);
        if ($digits === '') {
            return null;
        }

        if (str_starts_with($digits, '63') && strlen($digits) >= 12) {
            $digits = '0'.substr($digits, 2);
        }

        if (strlen($digits) > 20) {
            $digits = substr($digits, 0, 20);
        }

        return $digits;
    }
}
