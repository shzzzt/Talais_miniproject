<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Quarter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class QuarterController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $quarters = Quarter::query()
            ->when($request->filled('school_year_id'), fn ($q) => $q->where('school_year_id', $request->integer('school_year_id')))
            ->orderBy('quarter_number')
            ->get();

        return response()->json(['data' => $quarters]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'school_year_id' => ['required', 'integer', 'exists:school_years,id'],
            'quarter_number' => ['required', 'integer', 'between:1,4'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'is_current' => ['boolean'],
            'is_locked' => ['boolean'],
        ]);

        return response()->json(['data' => Quarter::create($data)], 201);
    }

    public function show(string $id): JsonResponse
    {
        return response()->json(['data' => Quarter::findOrFail($id)]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $quarter = Quarter::findOrFail($id);
        $data = $request->validate([
            'school_year_id' => ['sometimes', 'required', 'integer', 'exists:school_years,id'],
            'quarter_number' => ['sometimes', 'required', 'integer', 'between:1,4'],
            'start_date' => ['sometimes', 'required', 'date'],
            'end_date' => ['sometimes', 'required', 'date', 'after:start_date'],
            'is_current' => ['boolean'],
            'is_locked' => ['boolean'],
        ]);
        $quarter->fill($data)->save();

        return response()->json(['data' => $quarter]);
    }

    public function destroy(string $id): JsonResponse
    {
        Quarter::findOrFail($id)->delete();

        return response()->json(['data' => true]);
    }
}
