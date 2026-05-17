<?php

namespace App\Http\Requests;

use App\Models\User;
use App\Support\PhoneNumber;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $user = $this->user();

        if ($user->isParent()) {
            return [
                'name' => ['required', 'string', 'max:255'],
                'email' => [
                    'nullable',
                    'string',
                    'lowercase',
                    'email',
                    'max:255',
                    Rule::unique(User::class)->ignore($user->id),
                ],
                'phone_number' => [
                    'nullable',
                    'string',
                    'max:20',
                    Rule::unique('users', 'phone_number')->ignore($user->id),
                ],
            ];
        }
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class)->ignore($user->id),
            ],
            'avatar' => ['nullable', 'string', 'max:500'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->user()?->isParent() && $this->has('phone_number')) {
            $this->merge([
                'phone_number' => PhoneNumber::normalize($this->input('phone_number')),
            ]);
        }
    }
}
