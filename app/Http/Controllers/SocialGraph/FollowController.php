<?php

namespace App\Http\Controllers\SocialGraph;

use App\Http\Controllers\Controller;
use App\Http\Requests\SocialGraph\FollowRequest;
use App\Models\User;
use App\Services\SocialGraph\SocialGraphService;
use Illuminate\Http\RedirectResponse;

class FollowController extends Controller
{
    public function store(
        FollowRequest $request,
        User $user,
        SocialGraphService $socialGraphService,
    ): RedirectResponse {
        $this->authorize('follow', $user);

        $follow = $socialGraphService->follow($request->user(), $user);

        return back()->with(
            'success',
            $follow->status->value === 'accepted' ? 'User followed.' : 'Follow request sent.',
        );
    }

    public function destroy(
        FollowRequest $request,
        User $user,
        SocialGraphService $socialGraphService,
    ): RedirectResponse {
        $socialGraphService->unfollow($request->user(), $user);

        return back()->with('success', 'Follow removed.');
    }

    public function accept(
        FollowRequest $request,
        User $user,
        SocialGraphService $socialGraphService,
    ): RedirectResponse {
        abort_if($request->user()->is($user), 422);

        $socialGraphService->acceptRequest($request->user(), $user);

        return back()->with('success', 'Follow request accepted.');
    }

    public function reject(
        FollowRequest $request,
        User $user,
        SocialGraphService $socialGraphService,
    ): RedirectResponse {
        abort_if($request->user()->is($user), 422);

        $socialGraphService->rejectRequest($request->user(), $user);

        return back()->with('success', 'Follow request refused.');
    }
}
