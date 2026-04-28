<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GradeLevel;
use App\Models\SchoolYear;
use App\Models\Section;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SectionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $sections = Section::query()
            ->with(['gradeLevel:id,name', 'adviser:id,name', 'schoolYear:id,label,is_active'])
            ->withCount('enrollments')
            ->when($request->filled('school_year_id'), fn ($q) => $q->where('school_year_id', $request->integer('school_year_id')))
            ->when($request->filled('grade_level_id'), fn ($q) => $q->where('grade_level_id', $request->integer('grade_level_id')))
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%'.$request->string('search').'%';
                $q->where('name', 'ilike', $term);
            })
            ->orderBy('grade_level_id')
            ->orderBy('name')
            ->get()
            ->map(fn (Section $s) => $this->present($s));

        return response()->json(['data' => $sections]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->resolvePayload($request);

        $section = Section::create($data);

        return response()->json(['data' => $this->present($section->load('gradeLevel', 'adviser', 'schoolYear'))], 201);
    }

    public function show(string $id): JsonResponse
    {
        $section = Section::with(['gradeLevel', 'adviser', 'schoolYear'])
            ->withCount('enrollments')
            ->findOrFail($id);

        return response()->json(['data' => $this->present($section)]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $section = Section::findOrFail($id);

        $data = $this->resolvePayload($request, $section);
        $section->fill($data)->save();

        return response()->json(['data' => $this->present($section->load('gradeLevel', 'adviser', 'schoolYear'))]);
    }

    public function destroy(string $id): JsonResponse
    {
        $section = Section::findOrFail($id);

        if ($section->enrollments()->exists()) {
            return response()->json(['message' => 'Cannot delete a section that still has enrolled students.'], 422);
        }

        $section->delete();

        return response()->json(['data' => true]);
    }

    private function resolvePayload(Request $request, ?Section $existing = null): array
    {
        $data = $request->validate([
            'school_year_id' => ['nullable', 'integer', 'exists:school_years,id'],
            'grade_level_id' => ['nullable', 'integer', 'exists:grade_levels,id'],
            'grade_level' => ['nullable', 'string', 'max:30'],
            'name' => [$existing ? 'sometimes' : 'required', 'string', 'max:50'],
            'type' => ['nullable', Rule::in(['cream', 'regular'])],
            'session' => ['nullable', Rule::in(['AM', 'PM', 'whole_day'])],
            'adviser_id' => ['nullable', 'integer', 'exists:users,id'],
            'adviser_name' => ['nullable', 'string', 'max:120'],
            'adviser_email' => ['nullable', 'email', 'max:160'],
            'max_capacity' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        if (empty($data['grade_level_id']) && ! empty($data['grade_level'])) {
            $level = GradeLevel::where('name', $data['grade_level'])->first();
            if ($level) {
                $data['grade_level_id'] = $level->id;
            }
        }
        unset($data['grade_level']);

        if (empty($data['school_year_id'])) {
            $year = SchoolYear::active() ?? SchoolYear::orderByDesc('id')->first();
            $data['school_year_id'] = $year?->id;
        }

        if (empty($data['adviser_id']) && ! empty($data['adviser_email'])) {
            $user = \App\Models\User::where('email', $data['adviser_email'])->first();
            if ($user) {
                $data['adviser_id'] = $user->id;
            }
        }
        unset($data['adviser_name'], $data['adviser_email']);

        return array_filter($data, fn ($v) => $v !== null && $v !== '');
    }

    private function present(Section $s): array
    {
        return [
            'id' => $s->id,
            'name' => $s->name,
            'school_year_id' => $s->school_year_id,
            'grade_level_id' => $s->grade_level_id,
            'grade_level' => $s->gradeLevel?->name,
            'type' => $s->type,
            'session' => $s->session,
            'adviser_id' => $s->adviser_id,
            'adviser_name' => $s->adviser?->name,
            'adviser_email' => $s->adviser?->email,
            'max_capacity' => $s->max_capacity,
            'enrollments_count' => $s->enrollments_count ?? null,
            'created_at' => $s->created_at,
            'updated_at' => $s->updated_at,
        ];
    }
}
