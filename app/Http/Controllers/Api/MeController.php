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

        if ($user->hasFacultyRole()) {
            $user->loadMissing(['faculty.gradeLevelHead']);
        }

        return response()->json([
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'avatar' => $user->avatar,
                'two_factor_enabled' => (bool) $user->two_factor_enabled,
                'is_grade_level_head' => $user->hasFacultyRole() && (bool) $user->faculty?->is_grade_level_head,
                'grade_level_head_label' => $user->faculty?->gradeLevelHead?->name,
                'permissions' => $user->getAllPermissions()->pluck('name'),
                'roles' => $user->getRoleNames(),
                'last_login_at' => $user->last_login_at,
            ],
        ]);
    }
}
