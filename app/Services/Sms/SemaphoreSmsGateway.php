<?php

namespace App\Services\Sms;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Stub gateway for the Semaphore PH SMS provider.
 *
 * In production the `SEMAPHORE_API_KEY` would be set and `enabled = true`.
 * In dev / academic deployment we keep it disabled and log the would-be
 * payload, so the rest of the application can still be exercised.
 */
class SemaphoreSmsGateway
{
    public function __construct(
        private readonly string $apiKey = '',
        private readonly string $senderName = 'TALAIS',
        private readonly string $endpoint = 'https://api.semaphore.co/api/v4/messages',
        private readonly bool $enabled = false,
    ) {
    }

    public static function fromConfig(): self
    {
        return new self(
            apiKey: (string) config('services.semaphore.api_key', ''),
            senderName: (string) config('services.semaphore.sender_name', 'TALAIS'),
            endpoint: (string) config('services.semaphore.endpoint', 'https://api.semaphore.co/api/v4/messages'),
            enabled: (bool) config('services.semaphore.enabled', false),
        );
    }

    /**
     * Send an SMS message. Returns true on success.
     *
     * @param  string|array<int,string>  $recipients  Single number or list (comma-joined for the API)
     */
    public function send(string|array $recipients, string $message): bool
    {
        $numbers = is_array($recipients) ? implode(',', $recipients) : $recipients;

        if (! $this->enabled || $this->apiKey === '') {
            Log::info('[SemaphoreSmsGateway] (disabled) would send SMS', [
                'to' => $numbers,
                'message' => $message,
                'sender' => $this->senderName,
            ]);
            return true;
        }

        try {
            $response = Http::asForm()
                ->timeout(10)
                ->post($this->endpoint, [
                    'apikey' => $this->apiKey,
                    'number' => $numbers,
                    'message' => $message,
                    'sendername' => $this->senderName,
                ]);

            if ($response->successful()) {
                Log::info('[SemaphoreSmsGateway] sent', ['to' => $numbers, 'response' => $response->json()]);
                return true;
            }

            Log::warning('[SemaphoreSmsGateway] failed', ['to' => $numbers, 'status' => $response->status(), 'body' => $response->body()]);
            return false;
        } catch (Throwable $e) {
            Log::error('[SemaphoreSmsGateway] exception: '.$e->getMessage());
            return false;
        }
    }
}
