<?php

namespace App\Notifications\Channels;

use App\Services\Sms\SemaphoreSmsGateway;
use Illuminate\Notifications\Notification;

/**
 * Notification channel that pushes SMS messages through Semaphore.
 *
 * Notifications opting in via `via()` must implement a public method
 * `toSms($notifiable): array{ to: string|array, message: string }`.
 */
class SemaphoreSmsChannel
{
    public function __construct(private readonly SemaphoreSmsGateway $gateway) {}

    public function send(object $notifiable, Notification $notification): void
    {
        if (! method_exists($notification, 'toSms')) {
            return;
        }

        $payload = $notification->toSms($notifiable);
        $to = $payload['to'] ?? null;
        $message = (string) ($payload['message'] ?? '');

        if (! $to || $message === '') {
            return;
        }

        $this->gateway->send($to, $message);
    }
}
