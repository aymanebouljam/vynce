<?php

namespace App\Services\SocialGraph;

use App\Enums\FollowStatus;
use App\Models\Follow;
use App\Models\User;
use App\Models\UserBlock;
use App\Models\UserMute;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class SocialGraphService
{
    public function follow(User $actor, User $target): Follow
    {
        return DB::transaction(function () use ($actor, $target) {
            $follow = Follow::query()->updateOrCreate(
                [
                    'follower_id' => $actor->id,
                    'followed_id' => $target->id,
                ],
                [
                    'status' => $target->is_private ? FollowStatus::Pending : FollowStatus::Accepted,
                    'accepted_at' => $target->is_private ? null : now(),
                ],
            );

            return $follow->refresh();
        });
    }

    public function unfollow(User $actor, User $target): void
    {
        Follow::query()
            ->where('follower_id', $actor->id)
            ->where('followed_id', $target->id)
            ->delete();
    }

    public function acceptRequest(User $actor, User $requester): Follow
    {
        $follow = Follow::query()
            ->where('follower_id', $requester->id)
            ->where('followed_id', $actor->id)
            ->where('status', FollowStatus::Pending)
            ->firstOrFail();

        $follow->update([
            'status' => FollowStatus::Accepted,
            'accepted_at' => now(),
        ]);

        return $follow->refresh();
    }

    public function block(User $actor, User $target): void
    {
        DB::transaction(function () use ($actor, $target) {
            UserBlock::query()->updateOrCreate([
                'blocker_id' => $actor->id,
                'blocked_id' => $target->id,
            ]);

            Follow::query()
                ->where(fn ($query) => $query
                    ->where('follower_id', $actor->id)
                    ->where('followed_id', $target->id))
                ->orWhere(fn ($query) => $query
                    ->where('follower_id', $target->id)
                    ->where('followed_id', $actor->id))
                ->delete();
        });
    }

    public function unblock(User $actor, User $target): void
    {
        UserBlock::query()
            ->where('blocker_id', $actor->id)
            ->where('blocked_id', $target->id)
            ->delete();
    }

    public function mute(User $actor, User $target): UserMute
    {
        return UserMute::query()->updateOrCreate([
            'muter_id' => $actor->id,
            'muted_id' => $target->id,
        ]);
    }

    public function unmute(User $actor, User $target): void
    {
        UserMute::query()
            ->where('muter_id', $actor->id)
            ->where('muted_id', $target->id)
            ->delete();
    }

    public function follows(User $actor, User $target): bool
    {
        return Follow::query()
            ->where('follower_id', $actor->id)
            ->where('followed_id', $target->id)
            ->where('status', FollowStatus::Accepted)
            ->exists();
    }

    public function hasPendingRequest(User $actor, User $target): bool
    {
        return Follow::query()
            ->where('follower_id', $actor->id)
            ->where('followed_id', $target->id)
            ->where('status', FollowStatus::Pending)
            ->exists();
    }

    public function hasBlockBetween(User $first, User $second): bool
    {
        return UserBlock::query()
            ->where(fn ($query) => $query
                ->where('blocker_id', $first->id)
                ->where('blocked_id', $second->id))
            ->orWhere(fn ($query) => $query
                ->where('blocker_id', $second->id)
                ->where('blocked_id', $first->id))
            ->exists();
    }

    public function canViewProfile(?User $viewer, User $target): bool
    {
        if (! $target->is_private) {
            return ! ($viewer && $this->hasBlockBetween($viewer, $target));
        }

        if (! $viewer) {
            return false;
        }

        if ($viewer->is($target)) {
            return true;
        }

        if ($this->hasBlockBetween($viewer, $target)) {
            return false;
        }

        return $this->follows($viewer, $target);
    }

    public function followers(User $user, int $perPage = 20): LengthAwarePaginator
    {
        return User::query()
            ->select('users.*')
            ->join('follows', 'users.id', '=', 'follows.follower_id')
            ->where('follows.followed_id', $user->id)
            ->where('follows.status', FollowStatus::Accepted)
            ->paginate($perPage);
    }

    public function following(User $user, int $perPage = 20): LengthAwarePaginator
    {
        return User::query()
            ->select('users.*')
            ->join('follows', 'users.id', '=', 'follows.followed_id')
            ->where('follows.follower_id', $user->id)
            ->where('follows.status', FollowStatus::Accepted)
            ->paginate($perPage);
    }
}
