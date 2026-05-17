<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisteredParentRequest;
use App\Models\ParentGuardian;
use App\Models\Student;
use App\Models\User;
use App\Support\PhoneNumber;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    public function store(RegisteredParentRequest $request): RedirectResponse
    {
        $g = $request->validated('guardian');
        $accountEmail = $request->validated('email');
        $accountPhone = $request->validated('phone_number');
        $guardianContactRaw = trim((string) ($g['contact_number'] ?? ''));
        $guardianContact = $guardianContactRaw !== ''
            ? (PhoneNumber::normalize($guardianContactRaw) ?? $guardianContactRaw)
            : ($accountPhone ?? '');
        $accountName = trim(implode(' ', array_filter([
            $g['first_name'],
            $g['middle_name'] ?? '',
            $g['last_name'],
        ])));

        $user = null;

        DB::transaction(function () use ($request, $g, $guardianContact, $accountName, $accountEmail, $accountPhone, &$user) {
            $user = User::create([
                'name' => $accountName,
                'email' => $accountEmail,
                'phone_number' => $accountPhone,
                'password' => Hash::make($request->validated('password')),
                'role' => 'parent',
                'status' => 'active',
                'email_verified_at' => now(),
            ]);

            $user->assignRole('parent');

            $parent = ParentGuardian::create([
                'user_id' => $user->id,
                'first_name' => $g['first_name'],
                'middle_name' => $g['middle_name'] ?? null,
                'last_name' => $g['last_name'],
                'relationship' => $g['relationship'],
                'contact_number' => $guardianContact !== '' ? $guardianContact : null,
                'email' => isset($g['email']) && $g['email'] !== ''
                    ? $g['email']
                    : ($accountEmail ?: null),
                'mother_tongue' => $g['mother_tongue'] ?? null,
                'ip_ethnic_group' => $g['ip_ethnic_group'] ?? null,
                'religion' => $g['religion'] ?? null,
                'house_street_sitio' => $g['house_street_sitio'] ?? null,
                'barangay' => $g['barangay'] ?? null,
                'municipality_city' => $g['municipality_city'] ?? null,
                'province' => $g['province'] ?? null,
                'address' => $this->guardianAddressLine($g),
            ]);

            foreach ($request->validated('children') as $c) {
                $student = Student::create([
                    'lrn' => $c['lrn'] ?? null,
                    'first_name' => $c['first_name'],
                    'middle_name' => $c['middle_name'] ?? null,
                    'last_name' => $c['last_name'],
                    'suffix' => $c['suffix'] ?? null,
                    'birth_date' => $c['birth_date'],
                    'gender' => $c['gender'],
                    'birth_place' => $c['birth_place'] ?? null,
                    'mother_tongue' => $c['mother_tongue'] ?? null,
                    'ip_ethnic_group' => $c['ip_ethnic_group'] ?? null,
                    'religion' => $c['religion'] ?? null,
                    'house_street_sitio' => $c['house_street_sitio'] ?? null,
                    'barangay' => $c['barangay'] ?? null,
                    'municipality_city' => $c['municipality_city'] ?? null,
                    'province' => $c['province'] ?? null,
                    'status' => 'pending_enrollment',
                ]);

                $parent->students()->attach($student->id, ['is_primary' => true]);
            }
        });

        event(new Registered($user));

        Auth::login($user);

        return redirect(route('parent-portal.index', absolute: false))
            ->with('success', 'Account created. Your learner profile is now linked to your guardian account.');
    }

    /**
     * @param  array<string, mixed>  $g
     */
    private function guardianAddressLine(array $g): ?string
    {
        $parts = array_filter([
            trim((string) ($g['house_street_sitio'] ?? '')),
            trim((string) ($g['barangay'] ?? '')),
            trim((string) ($g['municipality_city'] ?? '')),
            trim((string) ($g['province'] ?? '')),
        ]);

        return $parts !== [] ? implode(', ', $parts) : null;
    }
}
