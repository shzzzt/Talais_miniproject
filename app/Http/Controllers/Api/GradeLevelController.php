<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GradeLevel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GradeLevelController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['data' => GradeLevel::orderBy('level_order')->get()]);
    }

    public function show(string $id): JsonResponse
    {
        return response()->json(['data' => GradeLevel::findOrFail($id)]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:30', 'unique:grade_levels,name'],
            'level_order' => ['required', 'integer', 'min:0'],
            'is_departmentalized' => ['boolean'],
            'has_session' => ['boolean'],
        ]);

        return response()->json(['data' => GradeLevel::create($data)], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $level = GradeLevel::findOrFail($id);
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:30', 'unique:grade_levels,name,'.$level->id],
            'level_order' => ['sometimes', 'required', 'integer', 'min:0'],
            'is_departmentalized' => ['boolean'],
            'has_session' => ['boolean'],
        ]);

        $level->fill($data)->save();

        return response()->json(['data' => $level]);
    }

    public function destroy(string $id): JsonResponse
    {
        GradeLevel::findOrFail($id)->delete();

        return response()->json(['data' => true]);
    }
}
