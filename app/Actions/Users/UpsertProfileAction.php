<?php

namespace App\Actions\Users;

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;

class UpsertProfileAction
{
    public function execute(User $user, array $data): User
    {
        $attributes = Arr::except($data, ['avatar', 'cover']);

        if ($data['avatar'] ?? null instanceof UploadedFile) {
            $attributes['avatar_path'] = $data['avatar']->store('avatars', 'public');
        }

        if ($data['cover'] ?? null instanceof UploadedFile) {
            $attributes['cover_path'] = $data['cover']->store('covers', 'public');
        }

        if (! $user->onboarding_completed_at) {
            $attributes['onboarding_completed_at'] = now();
        }

        $user->fill($attributes);

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        return $user->refresh();
    }
}
