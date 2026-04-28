<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SchoolYear;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SchoolYearController extends Controller
{
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

    public function destroy(string $id): JsonResponse
    {
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
}
