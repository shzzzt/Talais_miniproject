<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\TwoFactorService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class TwoFactorChallengeController extends Controller
{
    public function __construct(private readonly TwoFactorService $twoFactor) {}

    public function show(Request $request): Response|RedirectResponse
    {
        $userId = $request->session()->get('2fa.user_id');
        if (! $userId) {
            return redirect()->route('login');
        }

        return Inertia::render('Auth/TwoFactorChallenge', [
            'contactHint' => $this->contactHintForUser(User::find($userId)),
        ]);
    }

    private function contactHintForUser(?User $user): ?string
    {
        if (! $user) {
            return null;
        }

        return $user->email ?? $user->phone_number ?? null;
    }

    public function resend(Request $request): RedirectResponse
    {
        $userId = $request->session()->get('2fa.user_id');
        if (! $userId) {
            return redirect()->route('login');
        }

        $user = User::find($userId);
        if (! $user) {
            return redirect()->route('login');
        }

        try {
            $this->twoFactor->dispatch($user);
        } catch (RuntimeException $exception) {
            return back()->withErrors([
                'code' => $exception->getMessage(),
            ]);
        }

        return back()->with('status', 'A new verification code has been sent.');
    }

    public function verify(Request $request): RedirectResponse
    {
        $request->validate([
            'code' => ['required', 'string', 'digits:6'],
        ]);

        $userId = $request->session()->get('2fa.user_id');
        if (! $userId) {
            return redirect()->route('login');
        }

        $user = User::find($userId);
        if (! $user) {
            return redirect()->route('login');
        }

        if (! $this->twoFactor->verify($user, (string) $request->input('code'))) {
            throw ValidationException::withMessages([
                'code' => 'The verification code is invalid or expired.',
            ]);
        }

        Auth::login($user, (bool) $request->session()->pull('2fa.remember'));

        $user->forceFill([
            'last_login_at' => now(),
            'last_login_ip' => $request->ip(),
            'failed_login_count' => 0,
            'locked_until' => null,
        ])->saveQuietly();

        $request->session()->forget('2fa.user_id');
        $request->session()->regenerate();

        $homeRoute = $user->hasParentRole()
            ? route('parent-home.index', absolute: false)
            : route('dashboard', absolute: false);

        return redirect()->intended($homeRoute);
    }

    public function cancel(Request $request): RedirectResponse
    {
        $request->session()->forget(['2fa.user_id', '2fa.remember']);

        return redirect()->route('login');
    }
}
