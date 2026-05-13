<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GradeLevel;
use App\Models\SchoolYear;
use App\Services\SchoolYearRolloverService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SchoolYearController extends Controller
{
    public function __construct(
        private readonly SchoolYearRolloverService $schoolYearRollover,
    ) {}

    public function overview(Request $request): JsonResponse
    {
        $this->assertSystemAdmin($request);

        $years = SchoolYear::query()
            ->with([
                'sections' => fn ($q) => $q->orderBy('grade_level_id')->orderBy('name'),
                'sections.gradeLevel:id,name,level_order',
                'sections.adviser:id,name',
                'quarters' => fn ($q) => $q->orderBy('quarter_number'),
            ])
            ->withCount(['enrollments', 'sections'])
            ->orderByDesc('start_date')
            ->limit((int) $request->query('limit', 30))
            ->get();

        $gradeLevels = GradeLevel::query()->orderBy('level_order')->get();

        return response()->json([
            'data' => [
                'school_years' => $years->map(fn ($y) => $this->presentOverview($y)),
                'grade_levels' => $gradeLevels,
            ],
        ]);
    }

    public function rollover(Request $request): JsonResponse
    {
        $this->assertSystemAdmin($request);

        $created = $this->schoolYearRollover->rolloverIfDue();

        if (! $created) {
            return response()->json([
                'message' => 'Rollover not needed: active school year has not ended yet, or there is no active year.',
                'data' => ['rolled_over' => false],
            ]);
        }

        return response()->json([
            'data' => [
                'rolled_over' => true,
                'school_year' => $this->present($created),
            ],
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $years = SchoolYear::orderByDesc('start_date')
            ->limit((int) $request->query('limit', 50))
            ->get()
            ->map(fn ($y) => $this->present($y));

        return response()->json(['data' => $years]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->assertSystemAdmin($request);

        if (SchoolYear::query()->exists()) {
            return response()->json([
                'message' => 'Only the initial school year can be created here. After that, the next year is opened automatically when the current year ends.',
            ], 422);
        }

        $data = $this->normalizePayload($request);

        $rules = [
            'label' => ['required', 'string', 'max:20', 'unique:school_years,label'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'enrollment_start' => ['nullable', 'date'],
            'enrollment_end' => ['nullable', 'date', 'after_or_equal:enrollment_start'],
            'is_active' => ['nullable', 'boolean'],
        ];
        $validated = validator($data, $rules)->validate();

        $year = DB::transaction(function () use ($validated) {
            if (! empty($validated['is_active'])) {
                SchoolYear::query()->update(['is_active' => false]);
            }

            return SchoolYear::create($validated);
        });

        return response()->json(['data' => $this->present($year)], 201);
    }

    public function show(string $id): JsonResponse
    {
        return response()->json(['data' => $this->present(SchoolYear::findOrFail($id))]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $this->assertSystemAdmin($request);

        $year = SchoolYear::findOrFail($id);
        $data = $this->normalizePayload($request);

        $rules = [
            'label' => ['sometimes', 'required', 'string', 'max:20', 'unique:school_years,label,'.$year->id],
            'start_date' => ['sometimes', 'required', 'date'],
            'end_date' => ['sometimes', 'required', 'date', 'after:start_date'],
            'enrollment_start' => ['nullable', 'date'],
            'enrollment_end' => ['nullable', 'date', 'after_or_equal:enrollment_start'],
            'is_active' => ['nullable', 'boolean'],
        ];
        $validated = validator($data, $rules)->validate();

        DB::transaction(function () use ($year, $validated) {
            if (! empty($validated['is_active'])) {
                SchoolYear::query()->where('id', '!=', $year->id)->update(['is_active' => false]);
            }
            $year->fill($validated)->save();
        });

        return response()->json(['data' => $this->present($year->refresh())]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $this->assertSystemAdmin($request);

        $year = SchoolYear::findOrFail($id);

        if ($year->is_active) {
            return response()->json(['message' => 'Cannot delete the active school year.'], 422);
        }

        if ($year->enrollments()->exists() || $year->sections()->exists()) {
            return response()->json([
                'message' => 'Cannot delete a school year with enrollments or sections attached.',
            ], 422);
        }

        $year->delete();

        return response()->json(['data' => true]);
    }

    private function normalizePayload(Request $request): array
    {
        $data = $request->all();

        if (empty($data['label']) && ! empty($data['name'])) {
            $data['label'] = $data['name'];
        }
        unset($data['name']);

        if (isset($data['status']) && ! isset($data['is_active'])) {
            $data['is_active'] = $data['status'] === 'active';
        }
        unset($data['status']);

        return $data;
    }

    private function present(SchoolYear $year): array
    {
        return [
            'id' => $year->id,
            'name' => $year->label,
            'label' => $year->label,
            'start_date' => $year->start_date?->toDateString(),
            'end_date' => $year->end_date?->toDateString(),
            'enrollment_start' => $year->enrollment_start?->toDateString(),
            'enrollment_end' => $year->enrollment_end?->toDateString(),
            'is_active' => (bool) $year->is_active,
            'status' => $year->is_active ? 'active' : ($year->end_date && $year->end_date->isPast() ? 'completed' : 'planning'),
            'created_at' => $year->created_at,
            'updated_at' => $year->updated_at,
            'created_date' => $year->created_at?->toIso8601String(),
        ];
    }

    private function presentOverview(SchoolYear $year): array
    {
        $base = $this->present($year);

        $sections = $year->sections->map(function ($s) {
            return [
                'id' => $s->id,
                'name' => $s->name,
                'type' => $s->type,
                'session' => $s->session,
                'max_capacity' => $s->max_capacity,
                'grade_level_id' => $s->grade_level_id,
                'grade_level' => $s->gradeLevel?->name ?? 'Other',
                'grade_level_order' => $s->gradeLevel?->level_order,
                'adviser' => $s->adviser?->name,
            ];
        });

        $sectionsByGrade = $sections->groupBy('grade_level')->map(fn ($group) => $group->values())->all();

        $quarters = $year->quarters->map(fn ($q) => [
            'id' => $q->id,
            'name' => $q->name,
            'quarter_number' => $q->quarter_number,
            'start_date' => $q->start_date?->toDateString(),
            'end_date' => $q->end_date?->toDateString(),
            'is_grading_open' => (bool) $q->is_grading_open,
        ])->values();

        return array_merge($base, [
            'sections' => $sections->values(),
            'sections_by_grade' => $sectionsByGrade,
            'quarters' => $quarters,
            'enrollments_count' => $year->enrollments_count,
            'sections_count' => $year->sections_count,
        ]);
    }

    private function assertSystemAdmin(Request $request): void
    {
        $user = $request->user();
        abort_unless($user && $user->role === 'admin', 403, 'Only the system administrator can manage school year settings.');
    }
}
