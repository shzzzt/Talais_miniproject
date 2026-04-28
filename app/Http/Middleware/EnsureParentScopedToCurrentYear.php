<?php

namespace App\Http\Middleware;

use App\Models\SchoolYear;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Restricts parent users to viewing data only for the currently active
 * school year (TALAIS specification, §2 access matrix).
 *
 * Resolves the active school year and binds it to the request so downstream
 * controllers can scope queries via $request->attributes->get('active_school_year').
 */
class EnsureParentScopedToCurrentYear
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->role === 'parent') {
            $year = SchoolYear::where('is_active', true)->first();

            if (! $year) {
                abort(403, 'No active school year is configured.');
            }

            $request->attributes->set('active_school_year', $year);
            $request->attributes->set('parent_scoped', true);
        }

        return $next($request);
    }
}
