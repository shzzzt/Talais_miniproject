<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

/**
 * Daily PostgreSQL database backup at 02:00 (spatie/laravel-backup).
 * Output is appended to storage/logs/backup.log so the BackupLog table
 * stays consistent with what's on disk; manual runs go through the
 * BackupLogController::run endpoint.
 */
Schedule::command('backup:clean')->daily()->at('01:30');
Schedule::command('backup:run --only-db')->daily()->at('02:00');
Schedule::command('backup:run')->weekly()->sundays()->at('03:00');
