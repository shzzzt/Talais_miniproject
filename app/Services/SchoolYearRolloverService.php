<?php

namespace App\Services;

use App\Models\Quarter;
use App\Models\SchoolYear;
use App\Models\Section;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Creates the next school year automatically when the active year's end date has passed.
 * Clones quarter schedules (shifted by date delta) and section shells (same grade/name layout).
 */
class SchoolYearRolloverService
{
    public function rolloverIfDue(): ?SchoolYear
    {
        $active = SchoolYear::query()->where('is_active', true)->first();

        if (! $active) {
            return null;
        }

        $today = Carbon::today();
        if ($active->end_date === null || $today->lte($active->end_date)) {
            return null;
        }

        return $this->performRollover($active);
    }

    /**
     * Same as rolloverIfDue but callable manually (e.g. admin button) — still no-ops until the active year has ended.
     */
    public function rolloverIfEnded(): ?SchoolYear
    {
        return $this->rolloverIfDue();
    }

    private function performRollover(SchoolYear $active): SchoolYear
    {
        return DB::transaction(function () use ($active) {
            $active->load(['quarters', 'sections']);

            $newStart = $active->end_date->copy()->addDay();
            $durationDays = $active->start_date->diffInDays($active->end_date);
            $newEnd = $newStart->copy()->addDays($durationDays);

            $label = $this->nextLabel($active->label, $newStart, $newEnd);

            if (SchoolYear::where('label', $label)->exists()) {
                $label = $label.'-'.Str::lower(Str::random(4));
            }

            $enrollmentStart = null;
            $enrollmentEnd = null;
            if ($active->enrollment_start && $active->enrollment_end) {
                $offsetStart = $active->start_date->diffInDays($active->enrollment_start, false);
                $offsetEnd = $active->start_date->diffInDays($active->enrollment_end, false);
                $enrollmentStart = $newStart->copy()->addDays($offsetStart);
                $enrollmentEnd = $newStart->copy()->addDays($offsetEnd);
            }

            SchoolYear::query()->update(['is_active' => false]);

            $newYear = SchoolYear::create([
                'label' => $label,
                'start_date' => $newStart->toDateString(),
                'end_date' => $newEnd->toDateString(),
                'enrollment_start' => $enrollmentStart?->toDateString(),
                'enrollment_end' => $enrollmentEnd?->toDateString(),
                'is_active' => true,
            ]);

            $shiftDays = (int) $active->start_date->diffInDays($newStart, false);

            foreach ($active->quarters as $q) {
                Quarter::create([
                    'school_year_id' => $newYear->id,
                    'name' => $q->name,
                    'quarter_number' => $q->quarter_number,
                    'start_date' => $q->start_date->copy()->addDays($shiftDays)->toDateString(),
                    'end_date' => $q->end_date->copy()->addDays($shiftDays)->toDateString(),
                    'is_grading_open' => $q->quarter_number === 1,
                ]);
            }

            foreach ($active->sections as $section) {
                Section::create([
                    'school_year_id' => $newYear->id,
                    'grade_level_id' => $section->grade_level_id,
                    'name' => $section->name,
                    'type' => $section->type,
                    'session' => $section->session,
                    'adviser_id' => null,
                    'max_capacity' => $section->max_capacity,
                ]);
            }

            return $newYear->fresh();
        });
    }

    private function nextLabel(string $current, Carbon $newStart, Carbon $newEnd): string
    {
        if (preg_match('/^(\d{4})-(\d{4})$/', trim($current), $m)) {
            $y1 = (int) $m[1] + 1;
            $y2 = (int) $m[2] + 1;

            return $y1.'-'.$y2;
        }

        return $newStart->year.'-'.$newEnd->year;
    }
}
