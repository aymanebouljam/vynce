<?php

namespace Tests\Feature\Feed;

use App\Enums\FollowStatus;
use App\Models\Follow;
use App\Models\Post;
use App\Models\PostRepost;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class FeedTest extends TestCase
{
    use RefreshDatabase;

    public function test_home_feed_includes_visible_public_posts_alongside_own_and_followed_posts(): void
    {
        $viewer = User::factory()->create();
        $followed = User::factory()->create();
        $outsider = User::factory()->create();

        Follow::query()->create([
            'follower_id' => $viewer->id,
            'followed_id' => $followed->id,
            'status' => FollowStatus::Accepted,
            'accepted_at' => now(),
        ]);

        $ownPost = Post::factory()->for($viewer)->create(['body' => 'My post', 'visibility' => 'public']);
        $followedPost = Post::factory()->for($followed)->create(['body' => 'Followed post', 'visibility' => 'public']);
        $outsiderPost = Post::factory()->for($outsider)->create(['body' => 'Outsider post', 'visibility' => 'public']);

        $response = $this->actingAs($viewer)->get(route('feed.home'));

        $response->assertOk();
        $response->assertSee($ownPost->body);
        $response->assertSee($followedPost->body);
        $response->assertSee($outsiderPost->body);
    }

    public function test_home_feed_keeps_own_followers_only_posts_visible(): void
    {
        $viewer = User::factory()->create();
        $ownFollowersPost = Post::factory()->for($viewer)->create([
            'body' => 'Visible to me after editing',
            'visibility' => 'followers',
        ]);

        $response = $this->actingAs($viewer)->get(route('feed.home'));

        $response->assertOk();
        $response->assertSee($ownFollowersPost->body);
    }

    public function test_discover_feed_shows_public_non_self_posts(): void
    {
        $viewer = User::factory()->create();
        $publicPost = Post::factory()->create(['body' => 'Discover me', 'visibility' => 'public']);
        $ownPost = Post::factory()->for($viewer)->create(['body' => 'Do not show me']);

        $response = $this->actingAs($viewer)->get(route('feed.discover'));

        $response->assertOk();
        $response->assertSee($publicPost->body);
        $response->assertDontSee($ownPost->body);
    }

    public function test_profile_feed_includes_reposted_posts(): void
    {
        $viewer = User::factory()->create();
        $profileUser = User::factory()->create([
            'username' => 'profile-user',
        ]);
        $author = User::factory()->create();
        $repostedPost = Post::factory()->for($author)->create([
            'body' => 'A reposted post',
            'visibility' => 'public',
        ]);

        PostRepost::query()->create([
            'post_id' => $repostedPost->id,
            'user_id' => $profileUser->id,
        ]);

        $response = $this->actingAs($viewer)->get(route('users.show', $profileUser->username));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Profile/Show')
            ->where('feed.data.0.body', $repostedPost->body)
            ->where('feed.data.0.profile_reposted_at', fn ($value) => filled($value)));
    }
}
