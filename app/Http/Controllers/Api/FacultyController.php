<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Faculty;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FacultyController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $faculty = Faculty::query()
            ->with(['user:id,name,email,role,status', 'gradeLevelChair:id,name', 'gradeLevelHead:id,name'])
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%'.$request->string('search').'%';
                $q->where(function ($w) use ($term) {
                    $w->where('first_name', 'ilike', $term)
                        ->orWhere('last_name', 'ilike', $term)
                        ->orWhere('employee_id', 'ilike', $term);
                });
            })
            ->orderBy('last_name')
            ->limit((int) $request->query('limit', 200))
            ->get();

        return response()->json(['data' => $faculty]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules());

        return response()->json(['data' => Faculty::create($data)], 201);
    }

    public function show(string $id): JsonResponse
    {
        return response()->json(['data' => Faculty::with('user', 'gradeLevelChair', 'gradeLevelHead')->findOrFail($id)]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $faculty = Faculty::findOrFail($id);
        $data = $request->validate($this->rules($faculty->id));
        $faculty->fill($data)->save();

        return response()->json(['data' => $faculty]);
    }

    public function destroy(string $id): JsonResponse
    {
        Faculty::findOrFail($id)->delete();

        return response()->json(['data' => true]);
    }

    private function rules(?int $id = null): array
    {
        return [
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'employee_id' => ['nullable', 'string', 'max:50', 'unique:faculty,employee_id'.($id ? ','.$id : '')],
            'first_name' => ['required', 'string', 'max:80'],
            'middle_name' => ['nullable', 'string', 'max:80'],
            'last_name' => ['required', 'string', 'max:80'],
            'position' => ['nullable', 'string', 'max:120'],
            'specialization' => ['nullable', 'string', 'max:120'],
            'is_grade_level_chair' => ['boolean'],
            'grade_level_chair_of' => ['nullable', 'integer', 'exists:grade_levels,id'],
            'is_grade_level_head' => ['boolean'],
            'grade_level_head_of' => ['nullable', 'integer', 'exists:grade_levels,id'],
            'contact_number' => ['nullable', 'string', 'max:20'],
        ];
    }
}
