<?php

namespace App\Http\Controllers\Api\Concerns;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Lightweight CRUD trait used by the wave-3..6 entity controllers that
 * just need a thin REST shim mapped to a single Eloquent model. Each
 * controller declares the model class and (optionally) validation rules.
 */
trait HandlesEloquentResource
{
    abstract protected function model(): string;

    /**
     * @return array<string, array<int,mixed>|string>
     */
    protected function rules(?Model $existing = null): array
    {
        return [];
    }

    /**
     * @return array<int, string>
     */
    protected function filters(): array
    {
        return [];
    }

    protected function with(): array
    {
        return [];
    }

    public function index(Request $request): JsonResponse
    {
        $model = $this->model();

        $query = $model::query();
        if ($with = $this->with()) {
            $query->with($with);
        }

        foreach ($this->filters() as $filter) {
            if ($request->filled($filter)) {
                $query->where($filter, $request->input($filter));
            }
        }

        $orderBy = $request->string('order', '-created_at')->value();
        $direction = str_starts_with($orderBy, '-') ? 'desc' : 'asc';
        $column = ltrim($orderBy, '-');
        $column = $column === 'created_date' ? 'created_at' : $column;

        $items = $query
            ->orderBy($column, $direction)
            ->limit(min((int) $request->query('limit', 200), 1000))
            ->get();

        return response()->json(['data' => $items]);
    }

    public function show(string $id): JsonResponse
    {
        $model = $this->model();
        $query = $model::query();
        if ($with = $this->with()) {
            $query->with($with);
        }

        return response()->json(['data' => $query->findOrFail($id)]);
    }

    public function store(Request $request): JsonResponse
    {
        $model = $this->model();
        $rules = $this->rules();
        $data = $rules ? $request->validate($rules) : $request->all();

        return response()->json(['data' => $model::create($data)], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $model = $this->model();
        $instance = $model::findOrFail($id);
        $rules = $this->rules($instance);
        $data = $rules ? $request->validate($rules) : $request->all();
        $instance->fill($data)->save();

        return response()->json(['data' => $instance]);
    }

    public function destroy(string $id): JsonResponse
    {
        $model = $this->model();
        $instance = $model::findOrFail($id);
        $instance->delete();

        return response()->json(['data' => true]);
    }
}
