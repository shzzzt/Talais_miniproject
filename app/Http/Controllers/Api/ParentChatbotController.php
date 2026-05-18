<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ParentGuardian;
use App\Models\SchoolYear;
use App\Services\ParentChatbotService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ParentChatbotController extends Controller
{
    public function __invoke(Request $request, ParentChatbotService $chatbot): JsonResponse
    {
        $data = $request->validate([
            'message' => ['required', 'string', 'max:1000'],
            'student_id' => ['nullable', 'integer'],
            'history' => ['nullable', 'array', 'max:12'],
            'history.*.role' => ['required_with:history', 'in:user,assistant'],
            'history.*.text' => ['required_with:history', 'string', 'max:1000'],
        ]);

        $user = $request->user();
        $activeYear = $request->attributes->get('active_school_year') ?? SchoolYear::active();
        abort_unless($activeYear, 403, 'No active school year is configured.');

        $parent = ParentGuardian::query()
            ->where('user_id', $user->id)
            ->firstOrFail();

        $answer = $chatbot->answer(
            $parent,
            $activeYear,
            $data['message'],
            $data['history'] ?? [],
            isset($data['student_id']) ? (int) $data['student_id'] : null,
        );

        return response()->json([
            'data' => [
                'answer' => $answer,
            ],
        ]);
    }
}
