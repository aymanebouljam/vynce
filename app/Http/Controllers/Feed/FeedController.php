<?php

namespace App\Http\Controllers\Feed;

use App\Http\Controllers\Controller;
use App\Http\Resources\PostResource;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\Feed\FeedService;
use App\Services\SocialGraph\SocialGraphService;
use App\Support\InertiaPaginatedData;
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
                'can_follow' => request()->user()->id !== $user->id
                    && ! $socialGraphService->hasBlockBetween(request()->user(), $user),
                'can_message' => request()->user()->id !== $user->id
                    && ! $socialGraphService->hasBlockBetween(request()->user(), $user),
            ],
            'feed' => InertiaPaginatedData::fromPaginator(
                $feedService->profile(request()->user(), $user),
                PostResource::class,
            ),
        ]);
    }
}
