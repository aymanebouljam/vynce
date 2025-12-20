<?php

namespace App\Services\Feed;

use App\Enums\FollowStatus;
use App\Models\Post;
use App\Models\User;
use App\Services\SocialGraph\SocialGraphService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class FeedService
{
    public function __construct(
        private readonly SocialGraphService $socialGraphService,
    ) {}

    public function home(User $user, int $perPage = 10): LengthAwarePaginator
    {
        return $this->baseQuery($user)
            ->where(function (Builder $query) use ($user) {
                $query->where('posts.user_id', $user->id)
                    ->orWhereIn('posts.user_id', function ($subQuery) use ($user) {
                        $subQuery->select('followed_id')
                            ->from('follows')
                            ->where('follower_id', $user->id)
                            ->where('status', FollowStatus::Accepted);
                    });
            })
            ->latest('published_at')
            ->paginate($perPage);
    }

    public function following(User $user, int $perPage = 10): LengthAwarePaginator
    {
        return $this->baseQuery($user)
            ->whereIn('posts.user_id', function ($subQuery) use ($user) {
                $subQuery->select('followed_id')
                    ->from('follows')
                    ->where('follower_id', $user->id)
                    ->where('status', FollowStatus::Accepted);
            })
            ->latest('published_at')
            ->paginate($perPage);
    }

    public function discover(User $user, int $perPage = 10): LengthAwarePaginator
    {
        return $this->baseQuery($user)
            ->where('posts.visibility', 'public')
            ->where('posts.user_id', '!=', $user->id)
            ->latest('published_at')
            ->paginate($perPage);
    }

    public function profile(?User $viewer, User $profileUser, int $perPage = 10): LengthAwarePaginator
    {
        abort_unless($this->socialGraphService->canViewProfile($viewer, $profileUser), 403);

        return Post::query()
            ->with(['user', 'media'])
            ->where('user_id', $profileUser->id)
            ->when(
                ! $viewer || ! $viewer->is($profileUser),
                fn (Builder $query) => $query->whereNot('visibility', 'private'),
            )
            ->latest('published_at')
            ->paginate($perPage);
    }

    private function baseQuery(User $user): Builder
    {
        return Post::query()
            ->with(['user', 'media'])
            ->whereNull('deleted_at')
            ->whereNotExists(function ($query) use ($user) {
                $query->selectRaw('1')
                    ->from('user_blocks')
                    ->where(function ($subQuery) use ($user) {
                        $subQuery->whereColumn('user_blocks.blocker_id', 'posts.user_id')
                            ->where('user_blocks.blocked_id', $user->id);
                    })
                    ->orWhere(function ($subQuery) use ($user) {
                        $subQuery->where('user_blocks.blocker_id', $user->id)
                            ->whereColumn('user_blocks.blocked_id', 'posts.user_id');
                    });
            })
            ->where(function (Builder $query) use ($user) {
                $query->where('posts.visibility', 'public')
                    ->orWhere(function (Builder $followersQuery) use ($user) {
                        $followersQuery->where('posts.visibility', 'followers')
                            ->whereIn('posts.user_id', function ($subQuery) use ($user) {
                                $subQuery->select('followed_id')
                                    ->from('follows')
                                    ->where('follower_id', $user->id)
                                    ->where('status', FollowStatus::Accepted);
                            });
                    })
                    ->orWhere(function (Builder $privateQuery) use ($user) {
                        $privateQuery->where('posts.visibility', 'private')
                            ->where('posts.user_id', $user->id);
                    });
            });
    }
}
