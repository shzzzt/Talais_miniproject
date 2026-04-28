<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ParentGuardian;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ParentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $parents = ParentGuardian::query()
            ->with('students:id,first_name,middle_name,last_name')
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%'.$request->string('search').'%';
                $q->where(function ($w) use ($term) {
                    $w->where('first_name', 'ilike', $term)
                        ->orWhere('last_name', 'ilike', $term)
                        ->orWhere('contact_number', 'ilike', $term)
                        ->orWhere('email', 'ilike', $term);
                });
            })
            ->orderBy('last_name')
            ->limit((int) $request->query('limit', 200))
            ->get();

        return response()->json(['data' => $parents]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules());

        return response()->json(['data' => ParentGuardian::create($data)], 201);
    }

    public function show(string $id): JsonResponse
    {
        return response()->json([
            'data' => ParentGuardian::with('students')->findOrFail($id),
        ]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $parent = ParentGuardian::findOrFail($id);
        $data = $request->validate($this->rules());
        $parent->fill($data)->save();

        return response()->json(['data' => $parent]);
    }

    public function destroy(string $id): JsonResponse
    {
        ParentGuardian::findOrFail($id)->delete();

        return response()->json(['data' => true]);
    }

    private function rules(): array
    {
        return [
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'first_name' => ['required', 'string', 'max:80'],
            'middle_name' => ['nullable', 'string', 'max:80'],
            'last_name' => ['required', 'string', 'max:80'],
            'relationship' => ['nullable', Rule::in(['Father', 'Mother', 'Legal Guardian', 'Other'])],
            'contact_number' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:191'],
            'address' => ['nullable', 'string', 'max:500'],
        ];
    }
}
