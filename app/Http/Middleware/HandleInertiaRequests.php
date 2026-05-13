<?php

namespace App\Http\Middleware;

use App\Models\SchoolYear;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();
        $activeYear = null;
        if (Schema::hasTable('school_years')) {
            $activeYear = SchoolYear::where('is_active', true)->first();
        }

        if ($user && $user->hasFacultyRole()) {
            $user->loadMissing(['faculty.gradeLevelHead']);
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'avatar' => $user->avatar,
                    'two_factor_enabled' => (bool) $user->two_factor_enabled,
                    'is_grade_level_head' => $user->hasFacultyRole() && (bool) $user->faculty?->is_grade_level_head,
                    'grade_level_head_label' => $user->faculty?->gradeLevelHead?->name,
                ] : null,
                'permissions' => $user ? $user->getAllPermissions()->pluck('name') : [],
                'unread_notifications_count' => $user ? $user->unreadNotifications()->count() : 0,
                'recent_notifications' => $user
                    ? $user->notifications()->limit(8)->get()->map(fn ($n) => [
                        'id' => $n->id,
                        'type' => $n->data['type'] ?? class_basename($n->type),
                        'message' => $n->data['message'] ?? null,
                        'data' => $n->data,
                        'read_at' => $n->read_at?->toIso8601String(),
                        'created_at' => $n->created_at?->toIso8601String(),
                    ])
                    : [],
            ],
            'app' => [
                'name' => config('app.name'),
                'env' => config('app.env'),
            ],
            'active_school_year' => $activeYear ? [
                'id' => $activeYear->id,
                'label' => $activeYear->label,
                'start_date' => $activeYear->start_date?->toDateString(),
                'end_date' => $activeYear->end_date?->toDateString(),
            ] : null,
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'info' => fn () => $request->session()->get('info'),
            ],
            'ziggy' => fn () => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
        ];
    }
}
