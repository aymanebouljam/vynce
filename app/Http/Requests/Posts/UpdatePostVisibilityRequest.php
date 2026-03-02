<?php

namespace App\Http\Requests\Posts;

use App\Enums\PostVisibility;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePostVisibilityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->user()?->is_private) {
            $this->merge([
                'visibility' => PostVisibility::Private->value,
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'visibility' => ['required', Rule::in(['public', 'followers', 'private'])],
        ];
    }
}
