<?php

namespace App\Http\Requests\Posts;

use App\Enums\PostVisibility;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StorePostRequest extends FormRequest
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
            'body' => ['nullable', 'string', 'max:2000'],
            'visibility' => ['required', Rule::in(['public', 'followers', 'private'])],
            'media' => ['nullable', 'array', 'max:4'],
            'media.*' => ['image', 'max:8192'],
            'media_transform' => ['nullable', 'array'],
            'media_transform.*.position_x' => ['nullable', 'integer', 'between:0,100'],
            'media_transform.*.position_y' => ['nullable', 'integer', 'between:0,100'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $body = trim((string) $this->input('body', ''));
            $media = $this->file('media', []);

            if ($body === '' && count($media) === 0) {
                $validator->errors()->add('body', 'Write something or attach at least one image.');
            }
        });
    }
}
