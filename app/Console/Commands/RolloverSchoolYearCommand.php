<?php

namespace App\Console\Commands;

use App\Services\SchoolYearRolloverService;
use Illuminate\Console\Command;

class RolloverSchoolYearCommand extends Command
{
    protected $signature = 'school-year:rollover';

    protected $description = 'When the active school year end date has passed, create and activate the next year (quarters & section shells cloned).';

    public function handle(SchoolYearRolloverService $service): int
    {
        $created = $service->rolloverIfDue();

        if (! $created) {
            $this->info('No rollover performed (no active year past its end date).');

            return self::SUCCESS;
        }

        $this->info("Rolled over to school year #{$created->id} ({$created->label}).");

        return self::SUCCESS;
    }
}
