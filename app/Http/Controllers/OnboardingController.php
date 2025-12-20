<?php

namespace App\Http\Controllers;

use App\Actions\Users\UpsertProfileAction;
use App\Http\Requests\Users\ProfileOnboardingRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
    public function show(): Response
    {
        return Inertia::render('Onboarding/Index', [
            'profile' => UserResource::make(request()->user())->resolve(),
        ]);
    }

    public function store(
        ProfileOnboardingRequest $request,
        UpsertProfileAction $upsertProfileAction,
    ): RedirectResponse {
        $upsertProfileAction->execute($request->user(), $request->validated());

        return redirect()->route('feed.home');
    }
}
