<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * General-purpose in-app + email notification used by the rest of the
 * TALAIS system (grade submission, report-card publish, backup completed,
 * etc.). Channels default to database + mail; pass `channels` in the
 * constructor to restrict.
 */
class GeneralAlert extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * @param  array<string, mixed>  $payload
     * @param  array<int, string>    $channels
     */
    public function __construct(
        public readonly string $title,
        public readonly string $message,
        public readonly ?string $url = null,
        public readonly array $payload = [],
        public readonly array $channels = ['database', 'mail'],
    ) {
    }

    public function via(object $notifiable): array
    {
        $available = $this->channels;
        if (in_array('mail', $available, true) && empty($notifiable->email ?? null)) {
            $available = array_values(array_filter($available, fn ($c) => $c !== 'mail'));
        }
        return $available;
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject('TALAIS — '.$this->title)
            ->greeting('Hello '.($notifiable->name ?? 'there').',')
            ->line($this->message);

        if ($this->url) {
            $mail->action('Open TALAIS', $this->url);
        }

        return $mail->salutation('— Musuan Integrated School');
    }

    public function toArray(object $notifiable): array
    {
        return array_merge([
            'type' => 'general.alert',
            'title' => $this->title,
            'message' => $this->message,
            'url' => $this->url,
        ], $this->payload);
    }
}
