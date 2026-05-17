<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class SchoolSettingController extends Controller
{
    public const CACHE_KEY = 'talais.school.settings';

    public function show(): JsonResponse
    {
        return response()->json(['data' => $this->load()]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['nullable', 'string', 'max:160'],
            'division' => ['nullable', 'string', 'max:120'],
            'district' => ['nullable', 'string', 'max:120'],
            'municipality' => ['nullable', 'string', 'max:120'],
            'province' => ['nullable', 'string', 'max:120'],
            'region' => ['nullable', 'string', 'max:120'],
            'principal' => ['nullable', 'string', 'max:160'],
            'school_id' => ['nullable', 'string', 'max:50'],
            'logo_url' => ['nullable', 'string', 'max:500'],
            'theme_color' => ['nullable', 'string', 'max:32'],
            'grading' => ['nullable', 'array'],
            'security' => ['nullable', 'array'],
            'notifications' => ['nullable', 'array'],
        ]);

        $existing = $this->load();
        $merged = array_merge($existing, $data);
        Cache::forever(self::CACHE_KEY, $merged);

        return response()->json(['data' => $merged]);
    }

    private function load(): array
    {
        return Cache::get(self::CACHE_KEY, [
            'name' => 'Musuan Integrated School',
            'division' => 'Division of Bukidnon',
            'district' => 'Maramag District',
            'municipality' => 'Maramag',
            'province' => 'Bukidnon',
            'region' => 'Region X – Northern Mindanao',
            'principal' => 'Dr. Weenkie Jhon A. Marcelo',
            'school_id' => '300003',
            'logo_url' => null,
            'theme_color' => '#1e3a5f',
            'grading' => [
                'passing_mark' => 75,
                'ww_weight_elem' => 30,
                'pt_weight_elem' => 50,
                'qa_weight_elem' => 20,
                'ww_weight_sec' => 25,
                'pt_weight_sec' => 50,
                'qa_weight_sec' => 25,
            ],
            'security' => [
                'account_lockout' => true,
                'lockout_attempts' => 5,
                'session_timeout' => 30,
                'password_min' => 8,
            ],
            'notifications' => [
                'absence_alert' => true,
                'grade_submission' => true,
                'report_card_notif' => true,
                'backup_alerts' => true,
            ],
        ]);
    }
}
