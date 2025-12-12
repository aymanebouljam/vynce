<?php

namespace App\Http\Controllers\Feed;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Http\Resources\PostResource;
use App\Models\User;
use App\Services\Feed\FeedService;
use App\Services\SocialGraph\SocialGraphService;
use App\Support\InertiaPaginatedData;
use Inertia\Inertia;
use Inertia\Response;

class FeedController extends Controller
{
    public function home(FeedService $feedService): Response
    {
        $feed = $feedService->home(request()->user());

        return Inertia::render('Feed/Home', [
            'feed' => InertiaPaginatedData::fromPaginator($feed, PostResource::class),
            'activeTab' => 'home',
        ]);
    }

    public function following(FeedService $feedService): Response
    {
        $feed = $feedService->following(request()->user());

        return Inertia::render('Feed/Home', [
            'feed' => InertiaPaginatedData::fromPaginator($feed, PostResource::class),
            'activeTab' => 'following',
        ]);
    }

    public function discover(FeedService $feedService): Response
    {
        $feed = $feedService->discover(request()->user());

        return Inertia::render('Feed/Home', [
            'feed' => InertiaPaginatedData::fromPaginator($feed, PostResource::class),
            'activeTab' => 'discover',
        ]);
    }

    public function profile(
        User $user,
        FeedService $feedService,
        SocialGraphService $socialGraphService,
    ): Response
    {
        $this->authorize('view', $user);

        $profile = $user->loadCount([
            'posts',
            'acceptedFollowers',
            'acceptedFollowing',
        ]);

        return Inertia::render('Profile/Show', [
            'profile' => UserResource::make($profile)->resolve(),
            'relationship' => [
                'is_following' => $socialGraphService->follows(request()->user(), $user),
                'has_pending_request' => $socialGraphService->hasPendingRequest(request()->user(), $user),
                'can_follow' => request()->user()->id !== $user->id
                    && ! $socialGraphService->hasBlockBetween(request()->user(), $user),
            ],
            'feed' => InertiaPaginatedData::fromPaginator(
                $feedService->profile(request()->user(), $user),
                PostResource::class,
            ),
        ]);
    }
}
