<?php

namespace App\Jobs;

use App\Models\AttendanceRecord;
use App\Models\Enrollment;
use App\Models\ParentGuardian;
use App\Models\User;
use App\Notifications\AbsenceThresholdReached;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Notification;

/**
 * Counts the cumulative absences for a single enrollment and, when the
 * configured threshold (default 5 per quarter) is hit, dispatches the
 * AbsenceThresholdReached notification to the linked parent(s) plus any
 * users that hold the `attendance.notify` permission.
 */
class CheckAbsenceThreshold implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public readonly int $enrollmentId)
    {
    }

    public function handle(): void
    {
        $enrollment = Enrollment::with(['student.parents', 'section', 'schoolYear'])
            ->find($this->enrollmentId);

        if (! $enrollment || ! $enrollment->student) {
            return;
        }

        $settings = Cache::get('talais.school.settings', []);
        $threshold = (int) ($settings['notifications']['absence_threshold']
            ?? config('talais.absence_threshold')
            ?? 5);

        $absentCount = AttendanceRecord::query()
            ->where('enrollment_id', $enrollment->id)
            ->where(function ($q) {
                $q->where('am_status', 'absent')->orWhere('pm_status', 'absent');
            })
            ->count();

        if ($absentCount < $threshold) {
            return;
        }

        $cacheKey = "attendance_alert:{$enrollment->id}:{$absentCount}";
        if (Cache::has($cacheKey)) {
            return;
        }
        Cache::put($cacheKey, 1, now()->addDays(30));

        $student = $enrollment->student;
        $sectionName = $enrollment->section?->name;
        $schoolYearLabel = $enrollment->schoolYear?->label;

        $notification = new AbsenceThresholdReached(
            student: $student,
            absenceCount: $absentCount,
            threshold: $threshold,
            sectionName: $sectionName,
            schoolYearLabel: $schoolYearLabel,
        );

        $recipients = collect();

        $student->load('parents.user');
        foreach ($student->parents as $parent) {
            if ($parent->user) {
                $recipients->push($parent->user);
            } elseif ($parent instanceof ParentGuardian && ! empty($parent->email)) {
                $recipients->push((new \Illuminate\Notifications\AnonymousNotifiable)
                    ->route('mail', $parent->email));
            }
        }

        $staff = User::permission('attendance.notify')->get();
        $recipients = $recipients->merge($staff)->unique(fn ($u) => method_exists($u, 'getKey') ? $u->getKey() : spl_object_id($u));

        if ($recipients->isEmpty()) {
            return;
        }

        Notification::send($recipients, $notification);
    }
}
