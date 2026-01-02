<?php

namespace App\Http\Controllers\Users;

use App\Actions\Users\UpdateProfileImageAction;
use App\Actions\Users\UpsertProfileAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Users\ProfileUpdateRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
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

    public function updateAvatar(
        Request $request,
        UpdateProfileImageAction $updateProfileImageAction,
    ): RedirectResponse {
        $data = $request->validate([
            'avatar' => ['required', 'image', 'max:4096'],
            'zoom' => ['nullable', 'numeric', 'between:1,3'],
            'position_x' => ['nullable', 'integer', 'between:0,100'],
            'position_y' => ['nullable', 'integer', 'between:0,100'],
        ]);

        if ($data['avatar'] instanceof UploadedFile) {
            $updateProfileImageAction->replace($request->user(), 'avatar', $data['avatar'], $data);
        }

        return Redirect::route('users.show', $request->user()->username)
            ->with('success', 'Profile photo updated.');
    }

    public function updateCover(
        Request $request,
        UpdateProfileImageAction $updateProfileImageAction,
    ): RedirectResponse {
        $data = $request->validate([
            'cover' => ['required', 'image', 'max:6144'],
            'zoom' => ['nullable', 'numeric', 'between:1,3'],
            'position_x' => ['nullable', 'integer', 'between:0,100'],
            'position_y' => ['nullable', 'integer', 'between:0,100'],
        ]);

        if ($data['cover'] instanceof UploadedFile) {
            $updateProfileImageAction->replace($request->user(), 'cover', $data['cover'], $data);
        }

        return Redirect::route('users.show', $request->user()->username)
            ->with('success', 'Cover image updated.');
    }

    public function updateAvatarTransform(
        Request $request,
        UpdateProfileImageAction $updateProfileImageAction,
    ): RedirectResponse {
        $data = $request->validate([
            'zoom' => ['required', 'numeric', 'between:1,3'],
            'position_x' => ['required', 'integer', 'between:0,100'],
            'position_y' => ['required', 'integer', 'between:0,100'],
        ]);

        $updateProfileImageAction->updateTransform($request->user(), 'avatar', $data);

        return Redirect::route('users.show', $request->user()->username)
            ->with('success', 'Profile photo adjusted.');
    }

    public function updateCoverTransform(
        Request $request,
        UpdateProfileImageAction $updateProfileImageAction,
    ): RedirectResponse {
        $data = $request->validate([
            'zoom' => ['required', 'numeric', 'between:1,3'],
            'position_x' => ['required', 'integer', 'between:0,100'],
            'position_y' => ['required', 'integer', 'between:0,100'],
        ]);

        $updateProfileImageAction->updateTransform($request->user(), 'cover', $data);

        return Redirect::route('users.show', $request->user()->username)
            ->with('success', 'Cover image adjusted.');
    }

    public function destroyAvatar(
        Request $request,
        UpdateProfileImageAction $updateProfileImageAction,
    ): RedirectResponse {
        $updateProfileImageAction->remove($request->user(), 'avatar');

        return Redirect::route('users.show', $request->user()->username)
            ->with('success', 'Profile photo removed.');
    }

    public function destroyCover(
        Request $request,
        UpdateProfileImageAction $updateProfileImageAction,
    ): RedirectResponse {
        $updateProfileImageAction->remove($request->user(), 'cover');

        return Redirect::route('users.show', $request->user()->username)
            ->with('success', 'Cover image removed.');
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
