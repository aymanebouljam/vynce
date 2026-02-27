<?php

namespace App\Services\Feed;

use App\Enums\FollowStatus;
use App\Models\Post;
use App\Models\User;
use App\Services\SocialGraph\SocialGraphService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator as Paginator;

class FeedService
{
    public function __construct(
        private readonly SocialGraphService $socialGraphService,
    ) {}

    public function home(User $user, int $perPage = 10): LengthAwarePaginator
    {
        return $this->baseQuery($user)
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
        if (! $viewer || ! $this->socialGraphService->canViewProfilePosts($viewer, $profileUser)) {
            return new Paginator(collect(), 0, $perPage, 1);
        }

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

    public function search(
        User $user,
        string $search,
        int $userLimit = 5,
        int $postLimit = 5,
        int $topicLimit = 5,
    ): array {
        $term = trim($search);

        if ($term === '') {
            return [
                'users' => collect(),
                'posts' => collect(),
                'topics' => [],
            ];
        }

        $normalized = mb_strtolower($term);

        $users = User::query()
            ->where(function (Builder $query) use ($normalized) {
                $query->whereRaw('LOWER(users.name) LIKE ?', ["%{$normalized}%"])
                    ->orWhereRaw('LOWER(users.username) LIKE ?', ["%{$normalized}%"]);
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
            ->where(function (Builder $query) use ($user) {
                $query->where('users.is_private', false)
                    ->orWhere('users.id', $user->id)
                    ->orWhereExists(function ($subQuery) use ($user) {
                        $subQuery->selectRaw('1')
                            ->from('follows')
                            ->whereColumn('follows.followed_id', 'users.id')
                            ->where('follows.follower_id', $user->id)
                            ->where('follows.status', FollowStatus::Accepted);
                    });
            })
            ->limit($userLimit)
            ->get();

        $posts = $this->baseQuery($user)
            ->where(function (Builder $query) use ($normalized) {
                $query->whereRaw('LOWER(posts.body) LIKE ?', ["%{$normalized}%"])
                    ->orWhereRaw('LOWER(CAST(posts.hashtags AS TEXT)) LIKE ?', ["%{$normalized}%"]);
            })
            ->latest('published_at')
            ->limit($postLimit)
            ->get();

        $topics = $posts
            ->flatMap(fn (Post $post) => $post->hashtags ?? [])
            ->filter(fn ($tag) => str_contains(mb_strtolower((string) $tag), $normalized))
            ->map(fn ($tag) => ltrim((string) $tag, '#'))
            ->unique()
            ->values()
            ->take($topicLimit)
            ->all();

        return [
            'users' => $users,
            'posts' => $posts,
            'topics' => $topics,
        ];
    }

    private function baseQuery(User $user): Builder
    {
        return Post::query()
            ->with(['user', 'media', 'comments.user', 'comments.likes', 'likes', 'reposts'])
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
                $query->where('posts.user_id', $user->id)
                    ->orWhere('posts.visibility', 'public')
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
