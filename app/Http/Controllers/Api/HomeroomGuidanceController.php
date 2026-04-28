<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\HandlesEloquentResource;
use App\Http\Controllers\Controller;
use App\Models\HomeroomGuidanceAssessment;

class HomeroomGuidanceController extends Controller
{
    use HandlesEloquentResource;

    protected function model(): string
    {
        return HomeroomGuidanceAssessment::class;
    }

    protected function filters(): array
    {
        return ['enrollment_id', 'quarter_id'];
    }
}
