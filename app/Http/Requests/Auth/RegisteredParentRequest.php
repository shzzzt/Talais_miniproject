<?php

namespace App\Http\Requests\Auth;

use App\Models\User;
use App\Support\PhoneNumber;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class RegisteredParentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $email = $this->input('email');
        $this->merge([
            'email' => is_string($email) && trim($email) !== '' ? strtolower(trim($email)) : null,
            'phone_number' => PhoneNumber::normalize($this->input('phone_number')),
        ]);
    }

    public function rules(): array
    {
        return [
            'login_method' => ['required', Rule::in(['email', 'phone'])],
            'email' => [
                'required_if:login_method,email',
                'nullable',
                'string',
                'email',
                'max:191',
                Rule::unique(User::class, 'email'),
            ],
            'phone_number' => [
                'required_if:login_method,phone',
                'nullable',
                'string',
                'max:20',
                Rule::unique(User::class, 'phone_number'),
            ],
            'password' => [
                'required',
                'confirmed',
                Password::min(10)
                    ->mixedCase()
                    ->numbers()
                    ->symbols(),
            ],
            'guardian.first_name' => ['required', 'string', 'max:80'],
            'guardian.middle_name' => ['nullable', 'string', 'max:80'],
            'guardian.last_name' => ['required', 'string', 'max:80'],
            'guardian.relationship' => ['required', Rule::in(['Father', 'Mother', 'Legal Guardian', 'Other'])],
            'guardian.contact_number' => ['nullable', 'string', 'max:20'],
            'guardian.email' => ['nullable', 'string', 'lowercase', 'email', 'max:191'],
            'guardian.mother_tongue' => ['nullable', 'string', 'max:80'],
            'guardian.ip_ethnic_group' => ['nullable', 'string', 'max:80'],
            'guardian.religion' => ['nullable', 'string', 'max:80'],
            'guardian.house_street_sitio' => ['nullable', 'string', 'max:150'],
            'guardian.barangay' => ['nullable', 'string', 'max:80'],
            'guardian.municipality_city' => ['nullable', 'string', 'max:80'],
            'guardian.province' => ['nullable', 'string', 'max:80'],
        ];
    }
}
