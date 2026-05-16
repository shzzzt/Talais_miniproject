<?php

namespace App\Http\Middleware;

use App\Models\SchoolYear;
use Illuminate\Http\Request;
use Inertia\Middleware;

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
        if (\Illuminate\Support\Facades\Schema::hasTable('school_years')) {
            $activeYear = SchoolYear::where('is_active', true)->first();
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone_number' => $user->phone_number,
                    'role' => $user->role,
                    'is_grade_level_head' => (bool) $user->is_grade_level_head,
                    'avatar' => $user->avatar,
                    'email_verified_at' => $user->email_verified_at?->toIso8601String(),
                    'two_factor_enabled' => (bool) $user->two_factor_enabled,
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
                ...(new \Tighten\Ziggy\Ziggy)->toArray(),
                'location' => $request->url(),
            ],
        ];
    }
}
