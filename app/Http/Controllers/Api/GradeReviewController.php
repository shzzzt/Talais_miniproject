<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\HandlesEloquentResource;
use App\Http\Controllers\Controller;
use App\Models\GradeReviewAssignment;

class GradeReviewController extends Controller
{
    use HandlesEloquentResource;

    protected function model(): string
    {
        return GradeReviewAssignment::class;
    }

    protected function filters(): array
    {
        return ['school_year_id', 'reviewer_id', 'grade_level_id', 'status'];
    }
}
