<?php

namespace App\Notifications;

use App\Notifications\Channels\SemaphoreSmsChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TwoFactorCodeNotification extends Notification
{
    use Queueable;

    public function __construct(public readonly string $code, public readonly int $expiresInMinutes = 10)
    {
    }

    public function via(object $notifiable): array
    {
        $channels = [];

        if (! empty($notifiable->email)) {
            $channels[] = 'mail';
        }

        if (! empty($notifiable->contact_number) || ! empty($notifiable->phone_number) || ! empty($notifiable->mobile)) {
            $channels[] = SemaphoreSmsChannel::class;
        }

        return $channels;
    }

    public function toSms(object $notifiable): array
    {
        $to = $notifiable->contact_number ?? $notifiable->phone_number ?? $notifiable->mobile ?? null;

        return [
            'to' => $to,
            'message' => "TALAIS verification code: {$this->code}. It expires in {$this->expiresInMinutes} minutes. Do not share this code.",
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('TALAIS — Your sign-in verification code')
            ->greeting('Hello '.$notifiable->name.',')
            ->line('Use the following code to complete your sign-in to TALAIS:')
            ->line(new \Illuminate\Support\HtmlString("<h1 style=\"font-family: monospace; letter-spacing: 6px;\">{$this->code}</h1>"))
            ->line("This code expires in {$this->expiresInMinutes} minutes.")
            ->line('If you did not try to sign in, you can safely ignore this message.')
            ->salutation('— Musuan Integrated School');
    }
}
