<?php

namespace App\Http\Controllers\SocialGraph;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\SocialGraph\SocialGraphService;
use App\Support\InertiaPaginatedData;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ConnectionController extends Controller
{
    public function friends(
        Request $request,
        User $user,
        SocialGraphService $socialGraphService,
    ): Response|JsonResponse {
        $this->authorize('view', $user);
        $search = trim((string) $request->string('search'));
        $connections = InertiaPaginatedData::fromPaginator(
            $socialGraphService->friends($user, search: $search),
            UserResource::class,
        );

        if ($request->expectsJson()) {
            return response()->json([
                'connections' => $connections,
                'search' => $search,
            ]);
        }

        return Inertia::render('Connections/Index', [
            'profile' => UserResource::make($user)->resolve(),
            'connections' => $connections,
            'type' => 'friends',
            'title' => 'Friends',
            'emptyState' => 'No mutual connections yet.',
            'routeName' => 'users.friends',
            'routeParams' => ['user' => $user->username],
            'search' => $search,
        ]);
    }

    public function followers(
        Request $request,
        User $user,
        SocialGraphService $socialGraphService,
    ): Response|JsonResponse {
        $this->authorize('view', $user);
        $search = trim((string) $request->string('search'));
        $connections = InertiaPaginatedData::fromPaginator(
            $socialGraphService->followers($user, search: $search),
            UserResource::class,
        );

        if ($request->expectsJson()) {
            return response()->json([
                'connections' => $connections,
                'search' => $search,
            ]);
        }

        return Inertia::render('Connections/Index', [
            'profile' => UserResource::make($user)->resolve(),
            'connections' => $connections,
            'type' => 'followers',
            'title' => 'Followers',
            'emptyState' => 'No followers yet.',
            'routeName' => 'users.followers',
            'routeParams' => ['user' => $user->username],
            'search' => $search,
        ]);
    }

    public function following(
        Request $request,
        User $user,
        SocialGraphService $socialGraphService,
    ): Response|JsonResponse {
        $this->authorize('view', $user);
        $search = trim((string) $request->string('search'));
        $connections = InertiaPaginatedData::fromPaginator(
            $socialGraphService->following($user, search: $search),
            UserResource::class,
        );

        if ($request->expectsJson()) {
            return response()->json([
                'connections' => $connections,
                'search' => $search,
            ]);
        }

        return Inertia::render('Connections/Index', [
            'profile' => UserResource::make($user)->resolve(),
            'connections' => $connections,
            'type' => 'following',
            'title' => 'Following',
            'emptyState' => 'Not following anyone yet.',
            'routeName' => 'users.following',
            'routeParams' => ['user' => $user->username],
            'search' => $search,
        ]);
    }
}
