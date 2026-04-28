<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\HandlesEloquentResource;
use App\Http\Controllers\Controller;
use App\Models\PirReportSnapshot;

class PirReportController extends Controller
{
    use HandlesEloquentResource;

    protected function model(): string
    {
        return PirReportSnapshot::class;
    }

    protected function filters(): array
    {
        return ['school_year_id'];
    }
}
