<?php

namespace App\Http\Controllers\SocialGraph;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\SocialGraph\SocialGraphService;
use App\Support\InertiaPaginatedData;
use Inertia\Inertia;
use Inertia\Response;

class ConnectionController extends Controller
{
    public function contacts(SocialGraphService $socialGraphService): Response
    {
        $user = request()->user();

        return Inertia::render('Connections/Index', [
            'profile' => UserResource::make($user)->resolve(),
            'connections' => InertiaPaginatedData::fromPaginator(
                $socialGraphService->friends($user),
                UserResource::class,
            ),
            'type' => 'friends',
            'title' => 'Contacts',
            'emptyState' => 'No mutual connections yet.',
        ]);
    }

    public function friends(User $user, SocialGraphService $socialGraphService): Response
    {
        $this->authorize('view', $user);

        return Inertia::render('Connections/Index', [
            'profile' => UserResource::make($user)->resolve(),
            'connections' => InertiaPaginatedData::fromPaginator(
                $socialGraphService->friends($user),
                UserResource::class,
            ),
            'type' => 'friends',
            'title' => 'Friends',
            'emptyState' => 'No mutual connections yet.',
        ]);
    }

    public function followers(User $user, SocialGraphService $socialGraphService): Response
    {
        $this->authorize('view', $user);

        return Inertia::render('Connections/Index', [
            'profile' => UserResource::make($user)->resolve(),
            'connections' => InertiaPaginatedData::fromPaginator(
                $socialGraphService->followers($user),
                UserResource::class,
            ),
            'type' => 'followers',
            'title' => 'Followers',
            'emptyState' => 'No followers yet.',
        ]);
    }

    public function following(User $user, SocialGraphService $socialGraphService): Response
    {
        $this->authorize('view', $user);

        return Inertia::render('Connections/Index', [
            'profile' => UserResource::make($user)->resolve(),
            'connections' => InertiaPaginatedData::fromPaginator(
                $socialGraphService->following($user),
                UserResource::class,
            ),
            'type' => 'following',
            'title' => 'Following',
            'emptyState' => 'Not following anyone yet.',
        ]);
    }
}
