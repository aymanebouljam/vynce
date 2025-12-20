<?php

namespace App\Http\Controllers\Users;

use App\Actions\Users\UpsertProfileAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Users\ProfileUpdateRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit', [
            'status' => session('status'),
            'profile' => UserResource::make($request->user())->resolve(),
        ]);
    }

    public function update(
        ProfileUpdateRequest $request,
        UpsertProfileAction $upsertProfileAction,
    ): RedirectResponse {
        $upsertProfileAction->execute($request->user(), $request->validated());

        return Redirect::route('profile.edit')->with('success', 'Profile updated.');
    }

    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
