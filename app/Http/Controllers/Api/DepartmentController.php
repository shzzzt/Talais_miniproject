<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\DepartmentSubjectTeacher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DepartmentController extends Controller
{
    public function index(): JsonResponse
    {
        $rows = Department::query()
            ->withCount([
                'subjects',
                'facultyRoster',
            ])
            ->orderBy('name')
            ->get()
            ->map(function ($dept) {
                $dept->assignments_count = ($dept->subjects_count ?? 0) + ($dept->faculty_roster_count ?? 0);
                return $dept;
            });

        return response()->json(['data' => $rows]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
        ]);

        $department = Department::create($data);

        return response()->json(['data' => $department], 201);
    }

    public function show(string $id): JsonResponse
    {
        $department = Department::query()
            ->with([
                'assignments.subject:id,name,code',
                'assignments.faculty:id,first_name,middle_name,last_name,user_id',
            ])
            ->findOrFail($id);

        return response()->json(['data' => $department]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $department = Department::findOrFail($id);

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:120'],
        ]);

        $department->fill($data)->save();

        return response()->json(['data' => $department]);
    }

    public function destroy(string $id): JsonResponse
    {
        Department::findOrFail($id)->delete();

        return response()->json(['data' => true]);
    }

    public function syncAssignments(Request $request, string $id): JsonResponse
    {
        $department = Department::findOrFail($id);

        $data = $request->validate([
            'assignments' => ['required', 'array'],
            'assignments.*.subject_id' => ['required', 'integer', 'exists:subjects,id'],
            'assignments.*.faculty_id' => ['nullable', 'integer', 'exists:faculty,id'],
        ]);

        DB::transaction(function () use ($department, $data) {
            DepartmentSubjectTeacher::query()->where('department_id', $department->id)->delete();

            foreach ($data['assignments'] as $row) {
                DepartmentSubjectTeacher::create([
                    'department_id' => $department->id,
                    'subject_id' => $row['subject_id'],
                    'faculty_id' => $row['faculty_id'] ?? null,
                ]);
            }
        });

        $department->load([
            'assignments.subject:id,name,code',
            'assignments.faculty:id,first_name,middle_name,last_name,user_id',
        ]);

        return response()->json(['data' => $department]);
    }
}
