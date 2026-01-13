<?php

namespace App\Http\Controllers\SocialGraph;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\SocialGraph\SocialGraphService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class RelationshipController extends Controller
{
    public function block(Request $request, User $user, SocialGraphService $socialGraphService): RedirectResponse
    {
        abort_if($request->user()->is($user), 422);

        $socialGraphService->block($request->user(), $user);

        return back();
    }

    public function unblock(Request $request, User $user, SocialGraphService $socialGraphService): RedirectResponse
    {
        $socialGraphService->unblock($request->user(), $user);

        return back();
    }

    public function mute(Request $request, User $user, SocialGraphService $socialGraphService): RedirectResponse
    {
        abort_if($request->user()->is($user), 422);

        $socialGraphService->mute($request->user(), $user);

        return back();
    }

    public function unmute(Request $request, User $user, SocialGraphService $socialGraphService): RedirectResponse
    {
        $socialGraphService->unmute($request->user(), $user);

        return back();
    }
}
