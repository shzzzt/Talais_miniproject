<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MeController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'is_grade_level_head' => (bool) $user->is_grade_level_head,
                'avatar' => $user->avatar,
                'two_factor_enabled' => (bool) $user->two_factor_enabled,
                'permissions' => $user->getAllPermissions()->pluck('name'),
                'roles' => $user->getRoleNames(),
                'last_login_at' => $user->last_login_at,
            ],
        ]);
    }
}
