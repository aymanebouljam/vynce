<?php

use App\Http\Controllers\Feed\FeedController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\Posts\PostController;
use App\Http\Controllers\SocialGraph\FollowController;
use App\Http\Controllers\SocialGraph\RelationshipController;
use App\Http\Controllers\Users\ProfileController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return auth()->check()
        ? redirect()->route('feed.home')
        : redirect()->route('login');
})->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('/app', fn () => redirect()->route('feed.home'))->name('dashboard');
    Route::get('/settings', fn () => redirect()->route('profile.edit'))->name('settings');
    Route::get('/onboarding', [OnboardingController::class, 'show'])->name('onboarding.show');
    Route::post('/onboarding', [OnboardingController::class, 'store'])->name('onboarding.store');

    Route::get('/feed', [FeedController::class, 'home'])->name('feed.home');
    Route::get('/feed/following', [FeedController::class, 'following'])->name('feed.following');
    Route::get('/feed/discover', [FeedController::class, 'discover'])->name('feed.discover');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::post('/posts', [PostController::class, 'store'])->middleware('throttle:30,1')->name('posts.store');
    Route::patch('/posts/{post}', [PostController::class, 'update'])->middleware('throttle:30,1')->name('posts.update');
    Route::delete('/posts/{post}', [PostController::class, 'destroy'])->middleware('throttle:30,1')->name('posts.destroy');

    Route::post('/users/{user}/follow', [FollowController::class, 'store'])->middleware('throttle:60,1')->name('users.follow');
    Route::delete('/users/{user}/follow', [FollowController::class, 'destroy'])->middleware('throttle:60,1')->name('users.unfollow');
    Route::post('/users/{user}/accept-follow-request', [FollowController::class, 'accept'])->middleware('throttle:60,1')->name('users.follow-requests.accept');
    Route::post('/users/{user}/block', [RelationshipController::class, 'block'])->name('users.block');
    Route::delete('/users/{user}/block', [RelationshipController::class, 'unblock'])->name('users.unblock');
    Route::post('/users/{user}/mute', [RelationshipController::class, 'mute'])->name('users.mute');
    Route::delete('/users/{user}/mute', [RelationshipController::class, 'unmute'])->name('users.unmute');
});

require __DIR__.'/auth.php';

Route::middleware(['auth'])->group(function () {
    Route::get('/{user:username}', [FeedController::class, 'profile'])->name('users.show');
});
