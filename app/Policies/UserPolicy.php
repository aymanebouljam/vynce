<?php

namespace App\Policies;

use App\Models\User;
use App\Services\SocialGraph\SocialGraphService;

class UserPolicy
{
    public function __construct(
        private readonly SocialGraphService $socialGraphService,
    ) {}

    public function view(?User $viewer, User $user): bool
    {
        return $this->socialGraphService->canViewProfile($viewer, $user);
    }

    public function update(User $viewer, User $user): bool
    {
        return $viewer->is($user);
    }

    public function follow(User $viewer, User $user): bool
    {
        return ! $viewer->is($user)
            && ! $this->socialGraphService->hasBlockBetween($viewer, $user);
    }

    public function friend(User $viewer, User $user): bool
    {
        return ! $viewer->is($user)
            && ! $this->socialGraphService->hasBlockBetween($viewer, $user);
    }

    public function message(User $viewer, User $user): bool
    {
        return ! $viewer->is($user)
            && ! $this->socialGraphService->hasBlockBetween($viewer, $user);
    }
}
