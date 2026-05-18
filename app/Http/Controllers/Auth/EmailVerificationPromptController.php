<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmailVerificationPromptController extends Controller
{
    /**
     * Display the email verification prompt.
     */
    public function __invoke(Request $request): RedirectResponse|Response
    {
        $homeRoute = $request->user()?->hasParentRole()
            ? route('parent-home.index', absolute: false)
            : route('dashboard', absolute: false);

        return $request->user()->hasVerifiedEmail()
                    ? redirect()->intended($homeRoute)
                    : Inertia::render('Auth/VerifyEmail', ['status' => session('status')]);
    }
}
