<?php

namespace App\Services\SocialGraph;

use App\Enums\FollowStatus;
use App\Enums\FriendshipStatus;
use App\Models\Follow;
use App\Models\Friendship;
use App\Models\User;
use App\Models\UserBlock;
use App\Models\UserMute;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class SocialGraphService
{
    public function sendFriendRequest(User $actor, User $target): Friendship
    {
        return DB::transaction(function () use ($actor, $target) {
            $existing = Friendship::query()
                ->where(function (Builder $query) use ($actor, $target) {
                    $query->where('requester_id', $actor->id)
                        ->where('addressee_id', $target->id);
                })
                ->orWhere(function (Builder $query) use ($actor, $target) {
                    $query->where('requester_id', $target->id)
                        ->where('addressee_id', $actor->id);
                })
                ->first();

            if ($existing) {
                return $existing;
            }

            $friendship = Friendship::query()->create(
                [
                    'requester_id' => $actor->id,
                    'addressee_id' => $target->id,
                    'status' => FriendshipStatus::Pending,
                    'accepted_at' => null,
                ],
            );

            return $friendship->refresh();
        });
    }

    public function removeFriendship(User $actor, User $target): void
    {
        Friendship::query()
            ->where(function (Builder $query) use ($actor, $target) {
                $query->where('requester_id', $actor->id)
                    ->where('addressee_id', $target->id);
            })
            ->orWhere(function (Builder $query) use ($actor, $target) {
                $query->where('requester_id', $target->id)
                    ->where('addressee_id', $actor->id);
            })
            ->delete();
    }

    public function acceptFriendRequest(User $actor, User $requester): Friendship
    {
        $friendship = Friendship::query()
            ->where('requester_id', $requester->id)
            ->where('addressee_id', $actor->id)
            ->where('status', FriendshipStatus::Pending)
            ->firstOrFail();

        $friendship->update([
            'status' => FriendshipStatus::Accepted,
            'accepted_at' => now(),
        ]);

        return $friendship->refresh();
    }

    public function rejectFriendRequest(User $actor, User $requester): void
    {
        Friendship::query()
            ->where('requester_id', $requester->id)
            ->where('addressee_id', $actor->id)
            ->where('status', FriendshipStatus::Pending)
            ->delete();
    }

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

    public function rejectRequest(User $actor, User $requester): void
    {
        Follow::query()
            ->where('follower_id', $requester->id)
            ->where('followed_id', $actor->id)
            ->where('status', FollowStatus::Pending)
            ->delete();
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

            Friendship::query()
                ->where(fn ($query) => $query
                    ->where('requester_id', $actor->id)
                    ->where('addressee_id', $target->id))
                ->orWhere(fn ($query) => $query
                    ->where('requester_id', $target->id)
                    ->where('addressee_id', $actor->id))
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

    public function areFriends(User $first, User $second): bool
    {
        return Friendship::query()
            ->where(function (Builder $query) use ($first, $second) {
                $query->where(function (Builder $forward) use ($first, $second) {
                    $forward->where('requester_id', $first->id)
                        ->where('addressee_id', $second->id);
                })->orWhere(function (Builder $reverse) use ($first, $second) {
                    $reverse->where('requester_id', $second->id)
                        ->where('addressee_id', $first->id);
                });
            })
            ->where('status', FriendshipStatus::Accepted)
            ->exists();
    }

    public function hasPendingFriendRequest(User $actor, User $target): bool
    {
        return Friendship::query()
            ->where('requester_id', $actor->id)
            ->where('addressee_id', $target->id)
            ->where('status', FriendshipStatus::Pending)
            ->exists();
    }

    public function hasIncomingFriendRequest(User $actor, User $target): bool
    {
        return Friendship::query()
            ->where('requester_id', $target->id)
            ->where('addressee_id', $actor->id)
            ->where('status', FriendshipStatus::Pending)
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

    public function followers(User $user, int $perPage = 20, ?string $search = null): LengthAwarePaginator
    {
        return User::query()
            ->select('users.*')
            ->join('follows', 'users.id', '=', 'follows.follower_id')
            ->where('follows.followed_id', $user->id)
            ->where('follows.status', FollowStatus::Accepted)
            ->when($search, fn (Builder $query) => $this->applyUserSearch($query, $search))
            ->paginate($perPage);
    }

    public function following(User $user, int $perPage = 20, ?string $search = null): LengthAwarePaginator
    {
        return User::query()
            ->select('users.*')
            ->join('follows', 'users.id', '=', 'follows.followed_id')
            ->where('follows.follower_id', $user->id)
            ->where('follows.status', FollowStatus::Accepted)
            ->when($search, fn (Builder $query) => $this->applyUserSearch($query, $search))
            ->paginate($perPage);
    }

    public function friends(User $user, int $perPage = 20, ?string $search = null): LengthAwarePaginator
    {
        return User::query()
            ->select('users.*')
            ->where(function (Builder $query) use ($user) {
                $query->whereIn('users.id', function ($subQuery) use ($user) {
                    $subQuery->select('addressee_id')
                        ->from('friendships')
                        ->where('requester_id', $user->id)
                        ->where('status', FriendshipStatus::Accepted);
                })->orWhereIn('users.id', function ($subQuery) use ($user) {
                    $subQuery->select('requester_id')
                        ->from('friendships')
                        ->where('addressee_id', $user->id)
                        ->where('status', FriendshipStatus::Accepted);
                });
            })
            ->when($search, fn (Builder $query) => $this->applyUserSearch($query, $search))
            ->paginate($perPage);
    }

    protected function applyUserSearch(Builder $query, string $search): Builder
    {
        $term = mb_strtolower(trim($search));

        return $query->where(function (Builder $builder) use ($term) {
            $builder
                ->whereRaw('LOWER(users.name) LIKE ?', ["%{$term}%"])
                ->orWhereRaw('LOWER(users.username) LIKE ?', ["%{$term}%"]);
        });
    }

    public function pendingRequests(User $user): Collection
    {
        return User::query()
            ->select('users.*')
            ->join('friendships', 'users.id', '=', 'friendships.requester_id')
            ->where('friendships.addressee_id', $user->id)
            ->where('friendships.status', FriendshipStatus::Pending)
            ->orderByDesc('friendships.created_at')
            ->limit(6)
            ->get();
    }

    public function suggestions(User $user, int $limit = 3): Collection
    {
        return User::query()
            ->withCount(['acceptedFollowers', 'posts'])
            ->whereKeyNot($user->id)
            ->whereNotIn('users.id', function ($query) use ($user) {
                $query->select('followed_id')
                    ->from('follows')
                    ->where('follower_id', $user->id);
            })
            ->whereNotIn('users.id', function ($query) use ($user) {
                $query->select('blocked_id')
                    ->from('user_blocks')
                    ->where('blocker_id', $user->id);
            })
            ->whereNotIn('users.id', function ($query) use ($user) {
                $query->select('blocker_id')
                    ->from('user_blocks')
                    ->where('blocked_id', $user->id);
            })
            ->latest('users.id')
            ->limit($limit)
            ->get();
    }

    public function friendsCount(User $user): int
    {
        return Friendship::query()
            ->where(function (Builder $query) use ($user) {
                $query->where('requester_id', $user->id)
                    ->orWhere('addressee_id', $user->id);
            })
            ->where('status', FriendshipStatus::Accepted)
            ->count();
    }
}
