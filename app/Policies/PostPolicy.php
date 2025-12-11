<?php

namespace App\Policies;

use App\Models\Post;
use App\Models\User;
use App\Services\SocialGraph\SocialGraphService;

class PostPolicy
{
    public function __construct(
        private readonly SocialGraphService $socialGraphService,
    ) {
    }

    public function view(?User $viewer, Post $post): bool
    {
        if ($viewer && $post->user->is($viewer)) {
            return true;
        }

        if ($viewer && $this->socialGraphService->hasBlockBetween($viewer, $post->user)) {
            return false;
        }

        return match ($post->visibility->value) {
            'public' => $this->socialGraphService->canViewProfile($viewer, $post->user),
            'followers' => $viewer ? $this->socialGraphService->follows($viewer, $post->user) || $post->user->is($viewer) : false,
            'private' => $viewer ? $post->user->is($viewer) : false,
        };
    }

    public function create(User $user): bool
    {
        return $user->suspended_at === null;
    }

    public function update(User $user, Post $post): bool
    {
        return $post->user->is($user);
    }

    public function delete(User $user, Post $post): bool
    {
        return $post->user->is($user);
    }
}
