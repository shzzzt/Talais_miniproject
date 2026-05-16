<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
<<<<<<< Updated upstream
=======
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
                'avatar' => ['nullable', 'string', 'max:500'],
            ];
        }

>>>>>>> Stashed changes
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class)->ignore($this->user()->id),
            ],
            'avatar' => ['nullable', 'string', 'max:500'],
        ];
    }
}
