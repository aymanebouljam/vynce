<?php

namespace App\Http\Controllers\SocialGraph;

use App\Http\Controllers\Controller;
use App\Http\Requests\SocialGraph\FollowRequest;
use App\Models\User;
use App\Services\SocialGraph\SocialGraphService;
use Illuminate\Http\RedirectResponse;
use Symfony\Component\HttpFoundation\Response;

class FriendshipController extends Controller
{
    public function store(
        FollowRequest $request,
        User $user,
        SocialGraphService $socialGraphService,
    ): RedirectResponse {
        $this->authorize('friend', $user);

        $socialGraphService->sendFriendRequest($request->user(), $user);

        return back();
    }

    public function destroy(
        FollowRequest $request,
        User $user,
        SocialGraphService $socialGraphService,
    ): Response|RedirectResponse {
        $this->authorize('friend', $user);

        $socialGraphService->removeFriendship($request->user(), $user);

        if ($request->expectsJson()) {
            return response()->noContent();
        }

        return back();
    }

    public function accept(
        FollowRequest $request,
        User $user,
        SocialGraphService $socialGraphService,
    ): RedirectResponse {
        abort_if($request->user()->is($user), 422);

        $socialGraphService->acceptFriendRequest($request->user(), $user);

        return back();
    }

    public function reject(
        FollowRequest $request,
        User $user,
        SocialGraphService $socialGraphService,
    ): RedirectResponse {
        abort_if($request->user()->is($user), 422);

        $socialGraphService->rejectFriendRequest($request->user(), $user);

        return back();
    }
}
