<?php

use App\Http\Controllers\Feed\FeedController;
use App\Http\Controllers\Messaging\ConversationController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\Posts\PostController;
use App\Http\Controllers\Posts\PostEngagementController;
use App\Http\Controllers\PublicMediaController;
use App\Http\Controllers\SocialGraph\ConnectionController;
use App\Http\Controllers\SocialGraph\FollowController;
use App\Http\Controllers\SocialGraph\RelationshipController;
use App\Http\Controllers\Users\ProfileController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return auth()->check()
        ? redirect()->route('feed.home')
        : redirect()->route('login');
})->name('home');

Route::get('/media/{path}', PublicMediaController::class)
    ->where('path', '.*')
    ->name('media.public');

Route::middleware(['auth'])->group(function () {
    Route::get('/app', fn () => redirect()->route('feed.home'))->name('dashboard');
    Route::get('/settings', fn () => redirect()->route('profile.edit'))->name('settings');
    Route::get('/onboarding', [OnboardingController::class, 'show'])->name('onboarding.show');
    Route::post('/onboarding', [OnboardingController::class, 'store'])->name('onboarding.store');

    Route::get('/feed', [FeedController::class, 'home'])->name('feed.home');
    Route::get('/feed/following', [FeedController::class, 'following'])->name('feed.following');
    Route::get('/feed/discover', [FeedController::class, 'discover'])->name('feed.discover');
    Route::get('/messages', [ConversationController::class, 'index'])->name('messages.index');
    Route::get('/messages/{conversation}', [ConversationController::class, 'show'])->name('messages.show');
    Route::post('/messages/start/{user}', [ConversationController::class, 'start'])->middleware('throttle:60,1')->name('messages.start');
    Route::post('/messages/{conversation}/messages', [ConversationController::class, 'storeMessage'])->middleware('throttle:120,1')->name('messages.messages.store');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::post('/profile/avatar', [ProfileController::class, 'updateAvatar'])->name('profile.avatar.update');
    Route::post('/profile/cover', [ProfileController::class, 'updateCover'])->name('profile.cover.update');
    Route::patch('/profile/avatar/transform', [ProfileController::class, 'updateAvatarTransform'])->name('profile.avatar.transform.update');
    Route::patch('/profile/cover/transform', [ProfileController::class, 'updateCoverTransform'])->name('profile.cover.transform.update');
    Route::delete('/profile/avatar', [ProfileController::class, 'destroyAvatar'])->name('profile.avatar.destroy');
    Route::delete('/profile/cover', [ProfileController::class, 'destroyCover'])->name('profile.cover.destroy');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::post('/posts', [PostController::class, 'store'])->middleware('throttle:30,1')->name('posts.store');
    Route::patch('/posts/{post}', [PostController::class, 'update'])->middleware('throttle:30,1')->name('posts.update');
    Route::delete('/posts/{post}', [PostController::class, 'destroy'])->middleware('throttle:30,1')->name('posts.destroy');
    Route::post('/posts/{post}/likes/toggle', [PostEngagementController::class, 'toggleLike'])->middleware('throttle:60,1')->name('posts.likes.toggle');
    Route::post('/posts/{post}/reposts/toggle', [PostEngagementController::class, 'toggleRepost'])->middleware('throttle:60,1')->name('posts.reposts.toggle');
    Route::post('/posts/{post}/comments', [PostEngagementController::class, 'storeComment'])->middleware('throttle:60,1')->name('posts.comments.store');

    Route::post('/users/{user}/follow', [FollowController::class, 'store'])->middleware('throttle:60,1')->name('users.follow');
    Route::delete('/users/{user}/follow', [FollowController::class, 'destroy'])->middleware('throttle:60,1')->name('users.unfollow');
    Route::post('/users/{user}/accept-follow-request', [FollowController::class, 'accept'])->middleware('throttle:60,1')->name('users.follow-requests.accept');
    Route::delete('/users/{user}/reject-follow-request', [FollowController::class, 'reject'])->middleware('throttle:60,1')->name('users.follow-requests.reject');
    Route::post('/users/{user}/block', [RelationshipController::class, 'block'])->name('users.block');
    Route::delete('/users/{user}/block', [RelationshipController::class, 'unblock'])->name('users.unblock');
    Route::post('/users/{user}/mute', [RelationshipController::class, 'mute'])->name('users.mute');
    Route::delete('/users/{user}/mute', [RelationshipController::class, 'unmute'])->name('users.unmute');
});

require __DIR__.'/auth.php';

Route::middleware(['auth'])->group(function () {
    Route::get('/{user:username}/friends', [ConnectionController::class, 'friends'])->name('users.friends');
    Route::get('/{user:username}/followers', [ConnectionController::class, 'followers'])->name('users.followers');
    Route::get('/{user:username}/following', [ConnectionController::class, 'following'])->name('users.following');
    Route::get('/{user:username}', [FeedController::class, 'profile'])->name('users.show');
});
