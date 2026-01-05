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

        $repostedAtSubquery = function ($query) use ($profileUser) {
            $query->from('post_reposts')
                ->select('created_at')
                ->whereColumn('post_reposts.post_id', 'posts.id')
                ->where('post_reposts.user_id', $profileUser->id)
                ->limit(1);
        };

        return $this->baseQuery($viewer ?? $profileUser)
            ->select('posts.*')
            ->selectSub($repostedAtSubquery, 'profile_reposted_at')
            ->where(function (Builder $query) use ($profileUser) {
                $query->where('posts.user_id', $profileUser->id)
                    ->orWhereExists(function ($subQuery) use ($profileUser) {
                        $subQuery->selectRaw('1')
                            ->from('post_reposts')
                            ->whereColumn('post_reposts.post_id', 'posts.id')
                            ->where('post_reposts.user_id', $profileUser->id);
                    });
            })
            ->orderByRaw(
                'COALESCE((select "created_at" from "post_reposts" where "post_reposts"."post_id" = "posts"."id" and "post_reposts"."user_id" = ? limit 1), "posts"."published_at") desc',
                [$profileUser->id],
            )
            ->paginate($perPage);
    }

    private function baseQuery(User $user): Builder
    {
        return Post::query()
            ->with(['user', 'media', 'comments.user', 'likes', 'reposts'])
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
