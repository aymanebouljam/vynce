<?php

namespace App\Http\Requests\Posts;

use Illuminate\Validation\Validator;

class UpdatePostRequest extends StorePostRequest
{
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $body = trim((string) $this->input('body', ''));
            $media = $this->file('media', []);
            $post = $this->route('post');
            $hasExistingMedia = $post?->media()->exists() ?? false;

            if ($body === '' && count($media) === 0 && ! $hasExistingMedia) {
                $validator->errors()->add('body', 'Write something or attach at least one image.');
            }
        });
    }
}
