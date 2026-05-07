<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Activitylog\Models\Activity;

class SystemLogController extends Controller
{
    public function auth(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('search', ''));

        $logs = Activity::query()
            ->with('causer:id,name,email,role')
            ->where('log_name', 'auth')
            ->when($search !== '', function ($q) use ($search) {
                $term = '%' . $search . '%';
                $q->where('description', 'ilike', $term)
                    ->orWhereHas('causer', fn($u) => $u->where('name', 'ilike', $term)->orWhere('email', 'ilike', $term));
            })
            ->latest('created_at')
            ->limit((int) $request->query('limit', 120))
            ->get();

        return response()->json(['data' => $logs]);
    }

    public function access(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('search', ''));

        $logs = Activity::query()
            ->with('causer:id,name,email,role')
            ->where('log_name', 'access')
            ->when($search !== '', function ($q) use ($search) {
                $term = '%' . $search . '%';
                $q->where('description', 'ilike', $term)
                    ->orWhereRaw('CAST(properties AS TEXT) ILIKE ?', [$term])
                    ->orWhereHas('causer', fn($u) => $u->where('name', 'ilike', $term)->orWhere('email', 'ilike', $term));
            })
            ->latest('created_at')
            ->limit((int) $request->query('limit', 120))
            ->get();

        return response()->json(['data' => $logs]);
    }

    public function errors(Request $request): JsonResponse
    {
        $lines = max(1, min((int) $request->query('lines', 150), 1000));
        $search = trim((string) $request->query('search', ''));
        $logPath = storage_path('logs/laravel.log');

        if (! file_exists($logPath)) {
            return response()->json(['data' => []]);
        }

        $tail = $this->tailLines($logPath, $lines * 6);
        $parsed = [];

        foreach ($tail as $line) {
            if (! preg_match('/^\[(.*?)\]\s+\w+\.([A-Z]+):\s*(.*)$/', $line, $m)) {
                continue;
            }

            $level = strtoupper($m[2]);
            if (! in_array($level, ['ERROR', 'CRITICAL', 'ALERT', 'EMERGENCY'], true)) {
                continue;
            }

            $message = trim($m[3]);
            if ($search !== '' && stripos($message, $search) === false && stripos($line, $search) === false) {
                continue;
            }

            $parsed[] = [
                'timestamp' => $m[1],
                'level' => $level,
                'message' => $message,
            ];
        }

        $parsed = array_slice(array_reverse($parsed), 0, $lines);

        return response()->json(['data' => $parsed]);
    }

    private function tailLines(string $filePath, int $lineCount): array
    {
        $file = new \SplFileObject($filePath, 'r');
        $file->seek(PHP_INT_MAX);
        $lastLine = $file->key();

        $start = max(0, $lastLine - $lineCount);
        $lines = [];
        for ($i = $start; $i <= $lastLine; $i++) {
            $file->seek($i);
            $line = trim((string) $file->current());
            if ($line !== '') {
                $lines[] = $line;
            }
        }

        return $lines;
    }
}
