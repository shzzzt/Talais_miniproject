<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BackupLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use Throwable;

/**
 * Manages backup-log records and exposes a `run` action that triggers a
 * spatie/laravel-backup run (which uses pg_dump under the hood for the
 * configured PostgreSQL connection).
 */
class BackupLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $logs = BackupLog::query()
            ->with('user:id,name')
            ->orderByDesc('created_at')
            ->limit((int) $request->query('limit', 100))
            ->get()
            ->map(fn ($l) => $this->present($l));

        return response()->json(['data' => $logs]);
    }

    public function show(string $id): JsonResponse
    {
        $log = BackupLog::with('user:id,name')->findOrFail($id);
        return response()->json(['data' => $this->present($log)]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'backup_type' => ['required', 'string', 'in:database,files,full'],
            'triggered_by' => ['nullable', 'string', 'in:manual,scheduled'],
            'status' => ['required', 'string', 'in:success,failed'],
            'file_path' => ['nullable', 'string', 'max:500'],
            'file_size_mb' => ['nullable', 'numeric'],
            'notes' => ['nullable', 'string'],
        ]);

        $data['triggered_by'] = $data['triggered_by'] ?? 'manual';
        $data['user_id'] = $request->user()?->id;
        $data['created_at'] = now();

        return response()->json(['data' => $this->present(BackupLog::create($data))], 201);
    }

    /**
     * Trigger a real backup (spatie/laravel-backup) and persist the result.
     * The package internally invokes pg_dump for our PostgreSQL connection.
     */
    public function run(Request $request): JsonResponse
    {
        $type = $request->input('type', 'database');
        $userId = $request->user()?->id;

        $command = match ($type) {
            'files' => 'backup:run --only-files',
            'full' => 'backup:run',
            default => 'backup:run --only-db',
        };

        try {
            $exitCode = Artisan::call($command);
            $output = trim(Artisan::output());

            $disk = Storage::disk(config('backup.backup.destination.disks')[0] ?? 'local');
            $files = collect($disk->allFiles())
                ->filter(fn ($p) => str_ends_with($p, '.zip'))
                ->sortByDesc(fn ($p) => $disk->lastModified($p));

            $latest = $files->first();
            $sizeMb = $latest ? round($disk->size($latest) / 1024 / 1024, 2) : null;

            $log = BackupLog::create([
                'backup_type' => $type,
                'triggered_by' => 'manual',
                'user_id' => $userId,
                'status' => $exitCode === 0 ? 'success' : 'failed',
                'file_path' => $latest,
                'file_size_mb' => $sizeMb,
                'notes' => mb_substr($output, 0, 4000),
                'created_at' => now(),
            ]);

            return response()->json([
                'data' => $this->present($log->fresh('user')),
                'output' => $output,
            ]);
        } catch (Throwable $e) {
            $log = BackupLog::create([
                'backup_type' => $type,
                'triggered_by' => 'manual',
                'user_id' => $userId,
                'status' => 'failed',
                'notes' => $e->getMessage(),
                'created_at' => now(),
            ]);

            return response()->json([
                'data' => $this->present($log->fresh('user')),
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Download a backup file
     */
    public function download(string $id)
    {
        $log = BackupLog::findOrFail($id);
        
        if (!$log->file_path) {
            return response()->json(['error' => 'No backup file available'], 404);
        }

        $disk = Storage::disk(config('backup.backup.destination.disks')[0] ?? 'local');
        
        if (!$disk->exists($log->file_path)) {
            return response()->json(['error' => 'Backup file not found'], 404);
        }

        return $disk->download($log->file_path);
    }

    private function present(BackupLog $log): array
    {
        return [
            'id' => $log->id,
            'backup_type' => $log->backup_type,
            'triggered_by' => $log->triggered_by,
            'user_id' => $log->user_id,
            'user_name' => $log->user?->name,
            'status' => $log->status,
            'file_path' => $log->file_path,
            'file_size_mb' => $log->file_size_mb !== null ? (float) $log->file_size_mb : null,
            'notes' => $log->notes,
            'created_at' => $log->created_at?->toIso8601String(),
        ];
    }
}
