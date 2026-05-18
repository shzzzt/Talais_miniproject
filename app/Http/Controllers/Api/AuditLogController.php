<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Activitylog\Models\Activity;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Activity::query()
            ->with('causer:id,name,email,role')
            ->where('log_name', '!=', 'access')
            ->when($request->filled('log_name'), fn ($q) => $q->where('log_name', $request->string('log_name')))
            ->when($request->filled('event'), fn ($q) => $q->where('event', $request->string('event')))
            ->when($request->filled('subject_type'), fn ($q) => $q->where('subject_type', $request->string('subject_type')))
            ->when($request->filled('causer_id'), fn ($q) => $q->where('causer_id', $request->integer('causer_id')))
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = '%'.$request->string('search').'%';
                $q->where('description', 'ilike', $search);
            })
            ->when($request->filled('from'), fn ($q) => $q->where('created_at', '>=', $request->date('from')))
            ->when($request->filled('to'), fn ($q) => $q->where('created_at', '<=', $request->date('to')))
            ->orderByDesc('created_at');

        $limit = (int) $request->query('limit', 100);
        $logs = $query->limit(min($limit, 1000))->get();

        return response()->json(['data' => $logs->map(fn ($l) => $this->present($l))]);
    }

    public function show(string $id): JsonResponse
    {
        $activity = Activity::with('causer:id,name,email,role')->findOrFail($id);

        return response()->json(['data' => $this->present($activity)]);
    }

    private function present(Activity $activity): array
    {
        return [
            'id' => $activity->id,
            'description' => $activity->description,
            'event' => $activity->event,
            'log_name' => $activity->log_name,
            'subject_type' => $activity->subject_type,
            'subject_id' => $activity->subject_id,
            'causer' => $activity->causer ? [
                'id' => $activity->causer->id,
                'name' => $activity->causer->name,
                'email' => $activity->causer->email,
                'role' => $activity->causer->role ?? null,
            ] : null,
            'properties' => $activity->properties,
            'created_at' => $activity->created_at,
        ];
    }
}
