<?php

namespace Tests\Feature\Feed;

use App\Enums\FollowStatus;
use App\Enums\FriendshipStatus;
use App\Models\Follow;
use App\Models\Friendship;
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

    public function test_home_feed_trending_hashtags_are_derived_from_recent_seeded_posts(): void
    {
        $viewer = User::factory()->create();
        $author = User::factory()->create();

        Post::factory()->for($author)->count(4)->create([
            'visibility' => 'public',
            'hashtags' => ['design_systems'],
        ]);

        Post::factory()->for($author)->count(3)->create([
            'visibility' => 'public',
            'hashtags' => ['launch_notes'],
        ]);

        Post::factory()->for($author)->count(2)->create([
            'visibility' => 'public',
            'hashtags' => ['creator_workflow'],
        ]);

        $response = $this->actingAs($viewer)->get(route('feed.home'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->where('trends.0.label', 'Design Systems')
            ->where('trends.0.posts', '4 posts today')
            ->where('trends.1.label', 'Launch Notes')
            ->where('trends.1.posts', '3 posts today')
            ->where('trends.2.label', 'Creator Workflow')
            ->where('trends.2.posts', '2 posts today'));
    }

    public function test_home_feed_trending_hashtags_fall_back_to_recent_posts_when_today_is_empty(): void
    {
        $viewer = User::factory()->create();
        $author = User::factory()->create();

        Post::factory()->for($author)->count(3)->create([
            'visibility' => 'public',
            'published_at' => now()->subDays(2),
            'hashtags' => ['weekly_design'],
        ]);

        Post::factory()->for($author)->count(2)->create([
            'visibility' => 'public',
            'published_at' => now()->subDays(2),
            'hashtags' => ['weekly_launch'],
        ]);

        $response = $this->actingAs($viewer)->get(route('feed.home'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->where('trends.0.label', 'Weekly Design')
            ->where('trends.0.posts', '3 posts this week')
            ->where('trends.1.label', 'Weekly Launch')
            ->where('trends.1.posts', '2 posts this week'));
    }

    public function test_home_feed_suggestions_exclude_followers_friends_and_following(): void
    {
        $viewer = User::factory()->create([
            'username' => 'viewer',
        ]);
        $following = User::factory()->create([
            'username' => 'following',
        ]);
        $follower = User::factory()->create([
            'username' => 'follower',
        ]);
        $friend = User::factory()->create([
            'username' => 'friend',
        ]);
        $pendingFriendRequest = User::factory()->create([
            'username' => 'pending-friend-request',
        ]);
        $outsider = User::factory()->create([
            'username' => 'outsider',
        ]);

        Follow::query()->create([
            'follower_id' => $viewer->id,
            'followed_id' => $following->id,
            'status' => FollowStatus::Accepted,
            'accepted_at' => now(),
        ]);

        Follow::query()->create([
            'follower_id' => $follower->id,
            'followed_id' => $viewer->id,
            'status' => FollowStatus::Accepted,
            'accepted_at' => now(),
        ]);

        Friendship::query()->create([
            'requester_id' => $viewer->id,
            'addressee_id' => $friend->id,
            'status' => FriendshipStatus::Accepted,
            'accepted_at' => now(),
        ]);

        Friendship::query()->create([
            'requester_id' => $viewer->id,
            'addressee_id' => $pendingFriendRequest->id,
            'status' => FriendshipStatus::Pending,
        ]);

        $response = $this->actingAs($viewer)->get(route('feed.home'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Feed/Home')
            ->has('suggestions', 1)
            ->where('suggestions.0.username', $outsider->username));
    }

    public function test_home_feed_suggestions_restore_former_friends_after_unfriending(): void
    {
        $viewer = User::factory()->create();
        $friend = User::factory()->create([
            'username' => 'former-friend',
        ]);

        Friendship::query()->create([
            'requester_id' => $viewer->id,
            'addressee_id' => $friend->id,
            'status' => FriendshipStatus::Accepted,
            'accepted_at' => now(),
        ]);

        $this->actingAs($viewer)
            ->get(route('feed.home'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('suggestions', fn ($suggestions) => ! collect($suggestions)
                    ->pluck('username')
                    ->contains($friend->username)));

        Friendship::query()
            ->where('requester_id', $viewer->id)
            ->where('addressee_id', $friend->id)
            ->delete();

        $this->actingAs($viewer)
            ->get(route('feed.home'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('suggestions.0.username', $friend->username));
    }

    public function test_searching_a_trending_tag_shows_matching_posts(): void
    {
        $viewer = User::factory()->create();
        $author = User::factory()->create();
        $matchedPost = Post::factory()->for($author)->create([
            'body' => 'A useful design note',
            'visibility' => 'public',
            'hashtags' => ['design_systems'],
        ]);
        Post::factory()->for($author)->create([
            'body' => 'Another idea',
            'visibility' => 'public',
            'hashtags' => ['launch_notes'],
        ]);

        $response = $this->actingAs($viewer)->get(route('feed.search', [
            'q' => 'design_systems',
            'filter' => 'posts',
        ]));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Search/Index')
            ->where('query', 'design_systems')
            ->where('filter', 'posts')
            ->where('posts.0.body', $matchedPost->body)
            ->where('posts.0.hashtags.0', 'design_systems'));
    }

    public function test_search_results_include_private_profiles(): void
    {
        $viewer = User::factory()->create();
        $privateProfile = User::factory()->create([
            'name' => 'Secret Creator',
            'username' => 'secret-creator',
            'is_private' => true,
        ]);

        $response = $this->actingAs($viewer)->get(route('feed.search', [
            'q' => 'secret',
            'filter' => 'people',
        ]));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Search/Index')
            ->where('query', 'secret')
            ->where('filter', 'people')
            ->where('users.0.username', $privateProfile->username)
            ->where('users.0.is_private', true));
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

    public function test_home_feed_hides_private_posts_from_non_friends(): void
    {
        $viewer = User::factory()->create();
        $privateAuthor = User::factory()->create([
            'is_private' => true,
            'username' => 'private-author',
        ]);
        $privatePost = Post::factory()->for($privateAuthor)->create([
            'body' => 'Private post that should stay hidden',
            'visibility' => 'private',
        ]);

        $response = $this->actingAs($viewer)->get(route('feed.home'));

        $response->assertOk();
        $response->assertDontSee($privatePost->body);
    }

    public function test_home_feed_hides_private_posts_from_pending_friend_requests(): void
    {
        $viewer = User::factory()->create();
        $privateAuthor = User::factory()->create([
            'is_private' => true,
            'username' => 'pending-private-author',
        ]);
        $privatePost = Post::factory()->for($privateAuthor)->create([
            'body' => 'Private post behind a pending request',
            'visibility' => 'private',
        ]);

        Friendship::query()->create([
            'requester_id' => $viewer->id,
            'addressee_id' => $privateAuthor->id,
            'status' => FriendshipStatus::Pending,
        ]);

        $response = $this->actingAs($viewer)->get(route('feed.home'));

        $response->assertOk();
        $response->assertDontSee($privatePost->body);
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

    public function test_private_profile_posts_are_visible_to_friends(): void
    {
        $viewer = User::factory()->create();
        $profileUser = User::factory()->create([
            'is_private' => true,
            'username' => 'private-profile',
        ]);
        $post = Post::factory()->for($profileUser)->create([
            'body' => 'Friends only post',
            'visibility' => 'private',
        ]);

        Friendship::query()->create([
            'requester_id' => $viewer->id,
            'addressee_id' => $profileUser->id,
            'status' => FriendshipStatus::Accepted,
            'accepted_at' => now(),
        ]);

        $response = $this->actingAs($viewer)->get(route('users.show', $profileUser->username));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Profile/Show')
            ->where('profile.can_view_posts', true)
            ->where('feed.data.0.body', $post->body));
    }

    public function test_private_posts_are_visible_to_friends_but_not_followers(): void
    {
        $friend = User::factory()->create();
        $follower = User::factory()->create();
        $profileUser = User::factory()->create([
            'username' => 'private-post-owner',
        ]);
        $post = Post::factory()->for($profileUser)->create([
            'body' => 'Friends only post',
            'visibility' => 'private',
        ]);

        Friendship::query()->create([
            'requester_id' => $friend->id,
            'addressee_id' => $profileUser->id,
            'status' => FriendshipStatus::Accepted,
            'accepted_at' => now(),
        ]);

        Follow::query()->create([
            'follower_id' => $follower->id,
            'followed_id' => $profileUser->id,
            'status' => FollowStatus::Accepted,
            'accepted_at' => now(),
        ]);

        $friendResponse = $this->actingAs($friend)->get(route('users.show', $profileUser->username));
        $followerResponse = $this->actingAs($follower)->get(route('users.show', $profileUser->username));

        $friendResponse->assertOk();
        $friendResponse->assertInertia(fn (Assert $page) => $page
            ->component('Profile/Show')
            ->where('feed.data.0.body', $post->body));

        $followerResponse->assertOk();
        $followerResponse->assertDontSee($post->body);
    }
}
