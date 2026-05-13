<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Faculty;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::query()
            ->with('roles:id,name')
            ->when(
                $request->filled('role') && $request->string('role') === 'faculty',
                fn ($q) => $q->with([
                    'faculty' => function ($fq) {
                        $fq->select('id', 'user_id', 'department_id')
                            ->with([
                                'department' => function ($dq) {
                                    $dq->select('id', 'name', 'grade_level_id')
                                        ->with(['gradeLevel' => fn ($gq) => $gq->select('id', 'name')]);
                                },
                            ]);
                    },
                ])
            )
            ->where('role', '!=', 'parent')
            ->when($request->user()->role === 'school_admin', fn ($q) => $q->where('role', '!=', 'admin'))
            ->when($request->filled('role'), fn ($q) => $q->where('role', $request->string('role')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = '%'.$request->string('search').'%';
                $q->where(function ($w) use ($search) {
                    $w->where('name', 'ilike', $search)
                        ->orWhere('email', 'ilike', $search);
                });
            })
            ->when($request->boolean('with_trashed'), fn ($q) => $q->withTrashed());

        $orderBy = $request->string('order', '-created_at')->value();
        $direction = str_starts_with($orderBy, '-') ? 'desc' : 'asc';
        $column = ltrim($orderBy, '-');
        if (in_array($column, ['name', 'email', 'role', 'status', 'created_at', 'last_login_at'], true)) {
            $query->orderBy($column, $direction);
        } else {
            $query->orderByDesc('created_at');
        }

        $limit = (int) $request->query('limit', 100);
        $users = $query->limit(min($limit, 500))->get();

        return response()->json(['data' => $this->present($users)]);
    }

    public function store(Request $request): JsonResponse
    {
        $allowedRoles = $request->user()->role === 'school_admin' ? ['school_admin', 'faculty'] : ['admin', 'school_admin', 'faculty'];

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:160', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)->letters()->numbers()],
            'role' => ['required', Rule::in($allowedRoles)],
            'phone_number' => ['nullable', 'string', 'max:30'],
            'status' => ['nullable', Rule::in(['active', 'inactive', 'suspended'])],
            'two_factor_enabled' => ['boolean'],
            'department_id' => ['nullable', 'integer', 'exists:departments,id'],
        ]);

        $facultyDepartmentOpts = [];
        if ($data['role'] === 'faculty') {
            $facultyDepartmentOpts['department_id'] = $data['department_id'] ?? null;
        }
        unset($data['department_id']);

        if ($request->user()->role === 'admin' && $data['role'] === 'faculty') {
            return response()->json(['message' => 'Faculty accounts are created by school administrators.'], 422);
        }

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => $data['role'],
            'phone_number' => $data['phone_number'] ?? null,
            'status' => $data['status'] ?? 'active',
            'two_factor_enabled' => (bool) ($data['two_factor_enabled'] ?? false),
        ]);

        Role::findOrCreate($data['role'], 'web');
        $user->syncRoles([$data['role']]);

        Faculty::ensureRosterRowForFacultyUser($user, $facultyDepartmentOpts);

        return response()->json(['data' => $this->presentOne($user->fresh(['roles', 'faculty.department']))], 201);
    }

    public function show(string $id): JsonResponse
    {
        $user = User::with('roles:id,name', 'permissions:id,name', 'faculty.department')->findOrFail($id);

        if (request()->user()->role === 'school_admin' && $user->role === 'admin') {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        return response()->json(['data' => $this->presentOne($user)]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $user = User::findOrFail($id);

        if ($request->user()->role === 'school_admin' && $user->role === 'admin') {
            return response()->json(['message' => 'You cannot edit system administrator accounts.'], 403);
        }

        $allowedRoles = $request->user()->role === 'school_admin' ? ['school_admin', 'faculty'] : ['admin', 'school_admin', 'faculty'];

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'email' => ['sometimes', 'required', 'email', 'max:160', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['nullable', 'confirmed', Password::min(8)->letters()->numbers()],
            'role' => ['sometimes', 'required', Rule::in($allowedRoles)],
            'phone_number' => ['nullable', 'string', 'max:30'],
            'status' => ['nullable', Rule::in(['active', 'inactive', 'suspended'])],
            'two_factor_enabled' => ['boolean'],
            'department_id' => ['sometimes', 'nullable', 'integer', 'exists:departments,id'],
        ]);

        if ($request->user()->role === 'admin'
            && ($data['role'] ?? null) === 'faculty'
            && $user->role !== 'faculty') {
            return response()->json(['message' => 'Faculty role changes are managed by school administrators.'], 422);
        }

        $hasDepartmentField = array_key_exists('department_id', $data);
        $departmentId = $data['department_id'] ?? null;
        unset($data['department_id']);

        if (! empty($data['password'])) {
            $user->password = Hash::make($data['password']);
        }
        unset($data['password']);

        $user->fill($data);
        $user->save();

        if (! empty($data['role'])) {
            Role::findOrCreate($data['role'], 'web');
            $user->syncRoles([$data['role']]);
        }

        $user->refresh();
        if ($user->role === 'faculty' && $hasDepartmentField) {
            Faculty::ensureRosterRowForFacultyUser($user, ['department_id' => $departmentId]);
        } else {
            Faculty::ensureRosterRowForFacultyUser($user);
        }

        return response()->json(['data' => $this->presentOne($user->fresh(['roles', 'faculty.department']))]);
    }

    public function destroy(string $id): JsonResponse
    {
        $user = User::findOrFail($id);

        if (request()->user()->role === 'school_admin' && $user->role === 'admin') {
            return response()->json(['message' => 'You cannot deactivate system administrator accounts.'], 403);
        }

        if ($user->id === request()->user()->id) {
            return response()->json(['message' => 'You cannot deactivate your own account.'], 422);
        }

        $user->delete();

        return response()->json(['data' => true]);
    }

    public function restore(string $id): JsonResponse
    {
        $user = User::withTrashed()->findOrFail($id);

        if (request()->user()->role === 'school_admin' && $user->role === 'admin') {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $user->restore();

        return response()->json(['data' => $this->presentOne($user->fresh('roles'))]);
    }

    public function unlock(string $id): JsonResponse
    {
        $user = User::findOrFail($id);

        if (request()->user()->role === 'school_admin' && $user->role === 'admin') {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $user->forceFill([
            'failed_login_count' => 0,
            'locked_until' => null,
        ])->save();

        return response()->json(['data' => $this->presentOne($user)]);
    }

    public function resetPassword(Request $request, string $id): JsonResponse
    {
        $user = User::findOrFail($id);

        if ($request->user()->role === 'school_admin' && $user->role === 'admin') {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $password = $request->input('password', Str::password(12));
        $user->password = Hash::make($password);
        $user->save();

        return response()->json([
            'data' => [
                'user_id' => $user->id,
                'temporary_password' => $request->boolean('return_password') ? $password : null,
            ],
        ]);
    }

    private function present($collection)
    {
        return $collection->map(fn ($user) => $this->presentOne($user));
    }

    private function presentOne(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'status' => $user->status,
            'phone_number' => $user->phone_number,
            'avatar' => $user->avatar,
            'two_factor_enabled' => (bool) $user->two_factor_enabled,
            'last_login_at' => $user->last_login_at,
            'last_login_ip' => $user->last_login_ip,
            'failed_login_count' => $user->failed_login_count,
            'locked_until' => $user->locked_until,
            'deleted_at' => $user->deleted_at,
            'created_at' => $user->created_at,
            'updated_at' => $user->updated_at,
            'roles' => $user->roles?->pluck('name'),
            'department_id' => $user->faculty?->department_id,
            'department' => ($d = $user->faculty?->department) ? [
                'id' => $d->id,
                'name' => $d->name,
                'grade_level_name' => $d->gradeLevel?->name,
            ] : null,
        ];
    }
}
