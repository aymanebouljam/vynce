<?php

namespace App\Http\Requests\Users;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:80'],
            'username' => [
                'required',
                'string',
                'lowercase',
                'min:3',
                'max:30',
                'regex:/^[a-z0-9_.-]+$/',
                Rule::unique(User::class, 'username')->ignore($this->route('user')?->id ?? $this->user()->id),
            ],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class, 'email')->ignore($this->user()->id),
            ],
            'bio' => ['nullable', 'string', 'max:240'],
            'website_url' => ['nullable', 'url:http,https', 'max:255'],
            'location' => ['nullable', 'string', 'max:80'],
            'is_private' => ['required', 'boolean'],
            'avatar' => ['nullable', 'image', 'max:4096'],
            'cover' => ['nullable', 'image', 'max:6144'],
        ];
    }
}
