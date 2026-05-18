<?php

namespace App\Http\Requests;

use App\Models\User;
use App\Support\PhoneNumber;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class ProfileUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $user = $this->user();
        $userId = $user->id;

        $commonRules = [
            'name' => ['required', 'string', 'max:255'],
            'two_factor_enabled' => ['sometimes', 'boolean'],
            'email' => [
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class)->ignore($userId),
            ],
        ];

        // Email is required for non-parents, nullable for parents
        if (! $user->isParent()) {
            $commonRules['email'] = array_merge(['required'], $commonRules['email']);
        } else {
            $commonRules['email'] = array_merge(['nullable'], $commonRules['email']);
        }

        if ($user->isParent()) {
            return array_merge($commonRules, [
                'phone_number' => [
                    'nullable',
                    'string',
                    'max:20',
                    Rule::unique(User::class, 'phone_number')->ignore($userId),
                ],
            ]);
        }

        return array_merge($commonRules, [
            'avatar' => ['nullable', 'string', 'max:500'], // Max URL length for avatar
        ]);
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        if ($this->user()?->isParent() && $this->has('phone_number')) {
            $this->merge([
                'phone_number' => PhoneNumber::normalize($this->input('phone_number')),
            ]);
        }
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if (! $this->boolean('two_factor_enabled')) {
                    return;
                }

                $email = $this->input('email', $this->user()?->email);
                $phone = $this->input('phone_number', $this->user()?->phone_number);

                if (blank($email) && blank($phone)) {
                    $validator->errors()->add(
                        'two_factor_enabled',
                        'Two-factor verification requires an email address or phone number.',
                    );
                }
            },
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'The name field is required.',
            'name.max' => 'The name must not exceed 255 characters.',
            'email.required' => 'The email field is required.',
            'email.email' => 'Please provide a valid email address.',
            'email.unique' => 'This email address is already in use.',
            'phone_number.unique' => 'This phone number is already in use.',
            'avatar.max' => 'The avatar URL must not exceed 500 characters.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'name' => 'name',
            'email' => 'email address',
            'phone_number' => 'phone number',
            'avatar' => 'avatar URL',
        ];
    }
}
