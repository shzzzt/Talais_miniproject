<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GradeLevel;
use App\Models\Subject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubjectController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $subjects = Subject::query()
            ->with('gradeLevels:id,name')
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%'.$request->string('search').'%';
                $q->where(function ($w) use ($term) {
                    $w->where('name', 'ilike', $term)->orWhere('code', 'ilike', $term);
                });
            })
            ->when($request->filled('grade_level'), function ($q) use ($request) {
                $q->whereHas('gradeLevels', fn ($g) => $g->where('name', $request->string('grade_level')));
            })
            ->orderBy('name')
            ->get()
            ->map(fn (Subject $s) => $this->present($s));

        return response()->json(['data' => $subjects]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120', 'unique:subjects,name'],
            'code' => ['nullable', 'string', 'max:20', 'unique:subjects,code'],
            'minutes_per_day' => ['nullable', 'integer', 'min:0', 'max:600'],
            'grade_level' => ['nullable', 'string', 'max:30'],
            'teacher_name' => ['nullable', 'string', 'max:120'],
        ]);
        $gradeLevelName = $data['grade_level'] ?? null;
        unset($data['grade_level'], $data['teacher_name']);

        $subject = Subject::create($data);
        $this->syncGradeLevel($subject, $gradeLevelName);

        return response()->json(['data' => $this->present($subject->load('gradeLevels'))], 201);
    }

    public function show(string $id): JsonResponse
    {
        return response()->json(['data' => $this->present(Subject::with('gradeLevels')->findOrFail($id))]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $subject = Subject::findOrFail($id);

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:120', 'unique:subjects,name,'.$subject->id],
            'code' => ['nullable', 'string', 'max:20', 'unique:subjects,code,'.$subject->id],
            'minutes_per_day' => ['nullable', 'integer', 'min:0', 'max:600'],
            'grade_level' => ['nullable', 'string', 'max:30'],
            'teacher_name' => ['nullable', 'string', 'max:120'],
        ]);
        $gradeLevelName = $data['grade_level'] ?? null;
        unset($data['grade_level'], $data['teacher_name']);

        $subject->fill($data)->save();
        $this->syncGradeLevel($subject, $gradeLevelName);

        return response()->json(['data' => $this->present($subject->load('gradeLevels'))]);
    }

    public function destroy(string $id): JsonResponse
    {
        Subject::findOrFail($id)->delete();

        return response()->json(['data' => true]);
    }

    private function syncGradeLevel(Subject $subject, ?string $gradeLevelName): void
    {
        if (! $gradeLevelName) {
            return;
        }
        $level = GradeLevel::where('name', $gradeLevelName)->first();
        if (! $level) {
            return;
        }
        $subject->gradeLevels()->syncWithoutDetaching([$level->id => [
            'written_work_weight' => 30,
            'performance_task_weight' => 50,
            'quarterly_assessment_weight' => 20,
        ]]);
    }

    private function present(Subject $s): array
    {
        $primary = $s->relationLoaded('gradeLevels')
            ? $s->gradeLevels->first()
            : $s->gradeLevels()->first();

        return [
            'id' => $s->id,
            'name' => $s->name,
            'code' => $s->code,
            'minutes_per_day' => $s->minutes_per_day,
            'grade_level' => $primary?->name,
            'grade_levels' => $s->relationLoaded('gradeLevels') ? $s->gradeLevels->pluck('name') : [],
            'teacher_name' => null,
            'created_at' => $s->created_at,
            'updated_at' => $s->updated_at,
        ];
    }
}
