<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\HandlesEloquentResource;
use App\Http\Controllers\Controller;
use App\Models\Sf3BookRecord;

class Sf3BookController extends Controller
{
    use HandlesEloquentResource;

    protected function model(): string
    {
        return Sf3BookRecord::class;
    }

    protected function filters(): array
    {
        return ['enrollment_id', 'quarter_id'];
    }
}
