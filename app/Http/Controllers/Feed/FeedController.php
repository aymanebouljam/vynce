<?php

namespace App\Http\Controllers\Feed;

use App\Http\Controllers\Controller;
use App\Http\Resources\PostResource;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\Feed\FeedService;
use App\Services\SocialGraph\SocialGraphService;
use App\Support\InertiaPaginatedData;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FeedController extends Controller
{
    public function home(FeedService $feedService, SocialGraphService $socialGraphService): Response
    {
        $feed = $feedService->home(request()->user());

        return Inertia::render('Feed/Home', [
            'feed' => InertiaPaginatedData::fromPaginator($feed, PostResource::class),
            'activeTab' => 'home',
            'pendingRequests' => UserResource::collection(
                $socialGraphService->pendingRequests(request()->user()),
            )->resolve(),
            'suggestions' => UserResource::collection(
                $socialGraphService->suggestions(request()->user()),
            )->resolve(),
        ]);
    }

    public function following(FeedService $feedService, SocialGraphService $socialGraphService): Response
    {
        $feed = $feedService->following(request()->user());

        return Inertia::render('Feed/Home', [
            'feed' => InertiaPaginatedData::fromPaginator($feed, PostResource::class),
            'activeTab' => 'following',
            'pendingRequests' => UserResource::collection(
                $socialGraphService->pendingRequests(request()->user()),
            )->resolve(),
            'suggestions' => UserResource::collection(
                $socialGraphService->suggestions(request()->user()),
            )->resolve(),
        ]);
    }

    public function discover(FeedService $feedService, SocialGraphService $socialGraphService): Response
    {
        $feed = $feedService->discover(request()->user());

        return Inertia::render('Feed/Home', [
            'feed' => InertiaPaginatedData::fromPaginator($feed, PostResource::class),
            'activeTab' => 'discover',
            'pendingRequests' => UserResource::collection(
                $socialGraphService->pendingRequests(request()->user()),
            )->resolve(),
            'suggestions' => UserResource::collection(
                $socialGraphService->suggestions(request()->user()),
            )->resolve(),
        ]);
    }

    public function search(Request $request, FeedService $feedService): Response|JsonResponse
    {
        $term = trim((string) $request->string('q'));
        $filter = trim((string) $request->string('filter', 'people'));
        $results = $feedService->search(
            request()->user(),
            $term,
            $request->expectsJson() ? 5 : 12,
            $request->expectsJson() ? 5 : 12,
            8,
        );

        $page = Inertia::render('Search/Index', [
            'query' => $term,
            'filter' => in_array($filter, ['people', 'posts'], true) ? $filter : 'people',
            'users' => UserResource::collection($results['users'])->resolve(),
            'posts' => PostResource::collection($results['posts'])->resolve(),
            'topics' => $results['topics'],
        ]);

        if ($request->header('X-Inertia')) {
            return $page;
        }

        if (! $request->expectsJson()) {
            return $page;
        }

        return response()->json([
            'query' => $term,
            'users' => UserResource::collection($results['users'])->resolve(),
            'posts' => PostResource::collection($results['posts'])->resolve(),
            'topics' => $results['topics'],
        ]);
    }

    public function profile(
        User $user,
        FeedService $feedService,
        SocialGraphService $socialGraphService,
    ): Response {
        $this->authorize('view', $user);

        $profile = $user->loadCount([
            'posts',
            'acceptedFollowers',
            'acceptedFollowing',
        ]);
        $profile->friends_count = $socialGraphService->friendsCount($user);

        return Inertia::render('Profile/Show', [
            'profile' => UserResource::make($profile)->resolve(),
            'relationship' => [
                'is_following' => $socialGraphService->follows(request()->user(), $user),
                'has_pending_request' => $socialGraphService->hasPendingRequest(request()->user(), $user),
                'is_friend' => $socialGraphService->areFriends(request()->user(), $user),
                'has_pending_friend_request' => $socialGraphService->hasPendingFriendRequest(request()->user(), $user),
                'has_incoming_friend_request' => $socialGraphService->hasIncomingFriendRequest(request()->user(), $user),
                'can_follow' => request()->user()->id !== $user->id
                    && ! $socialGraphService->hasBlockBetween(request()->user(), $user),
                'can_friend' => request()->user()->id !== $user->id
                    && ! $socialGraphService->hasBlockBetween(request()->user(), $user),
                'can_message' => request()->user()->id !== $user->id
                    && ! $socialGraphService->hasBlockBetween(request()->user(), $user),
            ],
            'feed' => InertiaPaginatedData::fromPaginator(
                $feedService->profile(request()->user(), $user),
                PostResource::class,
            ),
            'pendingRequests' => UserResource::collection(
                $socialGraphService->pendingRequests(request()->user()),
            )->resolve(),
            'suggestions' => UserResource::collection(
                $socialGraphService->suggestions(request()->user()),
            )->resolve(),
        ]);
    }
}
