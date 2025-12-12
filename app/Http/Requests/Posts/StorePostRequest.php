<?php

namespace App\Http\Requests\Posts;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'body' => ['required', 'string', 'max:2000'],
            'visibility' => ['required', Rule::in(['public', 'followers', 'private'])],
            'media' => ['nullable', 'array', 'max:4'],
            'media.*' => ['image', 'max:8192'],
        ];
    }
}
