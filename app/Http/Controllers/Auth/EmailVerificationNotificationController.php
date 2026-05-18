<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Throwable;

class EmailVerificationNotificationController extends Controller
{
    /**
     * Send a new email verification notification.
     */
    public function store(Request $request): RedirectResponse
    {
        $homeRoute = $request->user()?->hasParentRole()
            ? route('parent-home.index', absolute: false)
            : route('dashboard', absolute: false);

        if ($request->user()->hasVerifiedEmail()) {
            return redirect()->intended($homeRoute);
        }

        if (blank($request->user()->email)) {
            return back()->withErrors([
                'email' => 'This account has no email address to verify.',
            ]);
        }

        try {
            $request->user()->sendEmailVerificationNotification();
        } catch (Throwable $exception) {
            report($exception);

            return back()->withErrors([
                'email' => 'The verification email could not be sent. Please check the mail settings.',
            ]);
        }

        return back()->with('status', config('mail.default') === 'log'
            ? 'verification-link-logged'
            : 'verification-link-sent');
    }
}
