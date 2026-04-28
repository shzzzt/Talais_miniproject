<?php

namespace App\Notifications;

use App\Models\Student;
use App\Notifications\Channels\SemaphoreSmsChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AbsenceThresholdReached extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly Student $student,
        public readonly int $absenceCount,
        public readonly int $threshold,
        public readonly ?string $sectionName = null,
        public readonly ?string $schoolYearLabel = null,
    ) {
    }

    public function via(object $notifiable): array
    {
        $channels = ['database'];
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
        $name = trim(($this->student->first_name ?? '').' '.($this->student->last_name ?? ''));
        $to = $notifiable->contact_number ?? $notifiable->phone_number ?? $notifiable->mobile ?? null;

        return [
            'to' => $to,
            'message' => "TALAIS Alert: {$name} has reached {$this->absenceCount} absences (threshold {$this->threshold}). Please contact the school adviser.",
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $name = trim(($this->student->first_name ?? '').' '.($this->student->last_name ?? ''));

        return (new MailMessage)
            ->subject('TALAIS — Attendance alert for '.$name)
            ->greeting('Good day,')
            ->line("This is an automated alert from Musuan Integrated School (TALAIS).")
            ->line("{$name} has now reached {$this->absenceCount} absence(s) for "
                .($this->schoolYearLabel ?: 'the current school year').'.')
            ->line('Please coordinate with the homeroom adviser regarding the student\'s attendance.')
            ->action('Open TALAIS', url('/StudentProfile/'.$this->student->id))
            ->salutation('— Musuan Integrated School');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'attendance.absence_threshold',
            'student_id' => $this->student->id,
            'student_name' => trim(($this->student->first_name ?? '').' '.($this->student->last_name ?? '')),
            'absence_count' => $this->absenceCount,
            'threshold' => $this->threshold,
            'section_name' => $this->sectionName,
            'school_year' => $this->schoolYearLabel,
            'message' => sprintf(
                '%s has reached %d absences (threshold: %d).',
                trim(($this->student->first_name ?? '').' '.($this->student->last_name ?? '')),
                $this->absenceCount,
                $this->threshold,
            ),
        ];
    }
}
