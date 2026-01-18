<?php

namespace App\Http\Controllers\SocialGraph;

use App\Http\Controllers\Controller;
use App\Http\Requests\SocialGraph\FollowRequest;
use App\Models\User;
use App\Services\SocialGraph\SocialGraphService;
use Illuminate\Http\RedirectResponse;
use Symfony\Component\HttpFoundation\Response;

class FollowController extends Controller
{
    public function store(
        FollowRequest $request,
        User $user,
        SocialGraphService $socialGraphService,
    ): RedirectResponse {
        $this->authorize('follow', $user);

        $socialGraphService->follow($request->user(), $user);

        return back();
    }

    public function destroy(
        FollowRequest $request,
        User $user,
        SocialGraphService $socialGraphService,
    ): Response|RedirectResponse {
        $socialGraphService->unfollow($request->user(), $user);

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

        $socialGraphService->acceptRequest($request->user(), $user);

        return back();
    }

    public function reject(
        FollowRequest $request,
        User $user,
        SocialGraphService $socialGraphService,
    ): RedirectResponse {
        abort_if($request->user()->is($user), 422);

        $socialGraphService->rejectRequest($request->user(), $user);

        return back();
    }
}
