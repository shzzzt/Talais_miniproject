<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Faculty;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FacultyController extends Controller
{
    public function unlinkedFacultyLogins(): JsonResponse
    {
        $users = User::query()
            ->where('role', 'faculty')
            ->whereDoesntHave('faculty')
            ->orderBy('name')
            ->limit(500)
            ->get(['id', 'name', 'email', 'role', 'status']);

        return response()->json(['data' => $users]);
    }

    public function bootstrapUnlinked(): JsonResponse
    {
        $users = User::query()
            ->where('role', 'faculty')
            ->whereDoesntHave('faculty')
            ->orderBy('name')
            ->get();

        $created = 0;
        foreach ($users as $user) {
            if (Faculty::query()->where('user_id', $user->id)->doesntExist()) {
                Faculty::ensureRosterRowForFacultyUser($user);
                $created++;
            }
        }

        return response()->json(['data' => ['created' => $created]]);
    }

    public function index(Request $request): JsonResponse
    {
        $faculty = Faculty::query()
            ->with([
                'user:id,name,email,role,status',
                'gradeLevelHead:id,name',
                'department:id,name',
            ])
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
        $data = $this->validated($request);
        $data = $this->applyGradeLevelHeadExclusive($request, $data);

        return response()->json(['data' => Faculty::create($data)], 201);
    }

    public function show(string $id): JsonResponse
    {
        return response()->json(['data' => Faculty::with('user', 'gradeLevelHead')->findOrFail($id)]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $faculty = Faculty::findOrFail($id);
        $data = $this->validated($request, $faculty->id);
        $data = $this->applyGradeLevelHeadExclusive($request, $data, $faculty);

        $faculty->fill($data)->save();

        return response()->json(['data' => $faculty]);
    }

    public function destroy(string $id): JsonResponse
    {
        Faculty::findOrFail($id)->delete();

        return response()->json(['data' => true]);
    }

    private function validated(Request $request, ?int $id = null): array
    {
        return $request->validate($this->rules($id));
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function applyGradeLevelHeadExclusive(Request $request, array $data, ?Faculty $faculty = null): array
    {
        if ($request->user()->role !== 'school_admin') {
            unset($data['is_grade_level_head'], $data['grade_level_head_of'], $data['user_id']);

            return $data;
        }

        $mergedIsHead = array_key_exists('is_grade_level_head', $data)
            ? (bool) $data['is_grade_level_head']
            : (bool) ($faculty?->is_grade_level_head);
        $mergedGradeId = array_key_exists('grade_level_head_of', $data)
            ? $data['grade_level_head_of']
            : $faculty?->grade_level_head_of;

        if (! $mergedIsHead || $mergedGradeId === null || $mergedGradeId === '') {
            $data['is_grade_level_head'] = false;
            $data['grade_level_head_of'] = null;

            return $data;
        }

        $data['is_grade_level_head'] = true;
        $data['grade_level_head_of'] = (int) $mergedGradeId;

        Faculty::query()
            ->where('grade_level_head_of', $data['grade_level_head_of'])
            ->when($faculty, fn ($q) => $q->where('id', '!=', $faculty->id))
            ->update(['is_grade_level_head' => false, 'grade_level_head_of' => null]);

        return $data;
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
            'is_grade_level_head' => ['boolean'],
            'grade_level_head_of' => ['nullable', 'integer', 'exists:grade_levels,id'],
            'contact_number' => ['nullable', 'string', 'max:20'],
            'department_id' => ['nullable', 'integer', 'exists:departments,id'],
        ];
    }
}
