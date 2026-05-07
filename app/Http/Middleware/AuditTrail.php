<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Lightweight middleware that captures the current request URL on the
 * activitylog logger so observers automatically include URL metadata.
 */
class AuditTrail
{
    public function handle(Request $request, Closure $next): Response
    {
        if (function_exists('activity')) {
            activity()->withProperties([
                'url' => $request->fullUrl(),
                'method' => $request->method(),
                'ip' => $request->ip(),
                'user_agent' => substr((string) $request->userAgent(), 0, 255),
            ]);

            if ($request->user() && $request->isMethod('GET') && ! $request->is('api/*') && $request->route()) {
                activity('access')
                    ->causedBy($request->user())
                    ->event('viewed')
                    ->withProperties([
                        'url' => $request->fullUrl(),
                        'method' => $request->method(),
                    ])
                    ->log('Visited ' . $request->path());
            }
        }

        return $next($request);
    }
}
