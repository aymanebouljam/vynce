<?php

namespace App\Http\Requests\Posts;

use Illuminate\Database\Query\Builder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCommentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'body' => ['required', 'string', 'max:500'],
            'parent_id' => [
                'nullable',
                'integer',
                Rule::exists('post_comments', 'id')->where(function (Builder $query) {
                    $query->where('post_id', $this->route('post')->id);
                }),
            ],
        ];
    }
}
