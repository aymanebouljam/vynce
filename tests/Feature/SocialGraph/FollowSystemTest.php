<?php

namespace Tests\Feature\SocialGraph;

use App\Enums\FollowStatus;
use App\Enums\FriendshipStatus;
use App\Models\Follow;
use App\Models\Friendship;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class FollowSystemTest extends TestCase
{
    use RefreshDatabase;

    public function test_following_a_public_account_is_accepted_immediately(): void
    {
        $actor = User::factory()->create();
        $target = User::factory()->create(['is_private' => false]);

        $this->actingAs($actor)
            ->post(route('users.follow', $target))
            ->assertRedirect();

        $this->assertDatabaseHas('follows', [
            'follower_id' => $actor->id,
            'followed_id' => $target->id,
            'status' => FollowStatus::Accepted->value,
        ]);
    }

    public function test_following_a_private_account_creates_a_pending_request(): void
    {
        $actor = User::factory()->create();
        $target = User::factory()->create(['is_private' => true]);

        $this->actingAs($actor)
            ->post(route('users.follow', $target))
            ->assertRedirect();

        $this->assertDatabaseHas('follows', [
            'follower_id' => $actor->id,
            'followed_id' => $target->id,
            'status' => FollowStatus::Pending->value,
        ]);
    }

    public function test_private_profiles_show_a_locked_preview_to_non_friends(): void
    {
        $viewer = User::factory()->create();
        $target = User::factory()->create(['is_private' => true]);
        $post = Post::factory()->for($target)->create(['body' => 'Secret post']);

        $this->actingAs($viewer)
            ->get(route('users.show', $target->username))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Profile/Show')
                ->where('profile.is_private', true)
                ->where('profile.can_view_posts', false)
                ->where('profile.is_private_for_viewer', true)
                ->where('feed.data', [])
                ->where('profile.name', $target->name)
                ->where('profile.avatar_url', fn ($value) => filled($value)));

        $this->assertDatabaseHas('posts', [
            'id' => $post->id,
        ]);
    }

    public function test_private_profiles_look_public_to_accepted_friends(): void
    {
        $viewer = User::factory()->create();
        $target = User::factory()->create(['is_private' => true]);
        $post = Post::factory()->for($target)->create([
            'body' => 'Friend-only post',
            'visibility' => 'private',
        ]);

        Friendship::query()->create([
            'requester_id' => $viewer->id,
            'addressee_id' => $target->id,
            'status' => FriendshipStatus::Accepted,
            'accepted_at' => now(),
        ]);

        $this->actingAs($viewer)
            ->get(route('users.show', $target->username))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Profile/Show')
                ->where('profile.is_private', true)
                ->where('profile.can_view_posts', true)
                ->where('profile.is_private_for_viewer', false)
                ->has('feed.data', 1)
                ->where('feed.data.0.body', $post->body)
                ->where('relationship.is_friend', true));
    }

    public function test_account_owner_can_accept_a_follow_request(): void
    {
        $requester = User::factory()->create();
        $owner = User::factory()->create(['is_private' => true]);

        Follow::query()->create([
            'follower_id' => $requester->id,
            'followed_id' => $owner->id,
            'status' => FollowStatus::Pending,
        ]);

        $this->actingAs($owner)
            ->post(route('users.follow-requests.accept', $requester))
            ->assertRedirect();

        $this->assertDatabaseHas('follows', [
            'follower_id' => $requester->id,
            'followed_id' => $owner->id,
            'status' => FollowStatus::Accepted->value,
        ]);
    }

    public function test_account_owner_can_reject_a_follow_request(): void
    {
        $requester = User::factory()->create();
        $owner = User::factory()->create(['is_private' => true]);

        Follow::query()->create([
            'follower_id' => $requester->id,
            'followed_id' => $owner->id,
            'status' => FollowStatus::Pending,
        ]);

        $this->actingAs($owner)
            ->delete(route('users.follow-requests.reject', $requester))
            ->assertRedirect();

        $this->assertDatabaseMissing('follows', [
            'follower_id' => $requester->id,
            'followed_id' => $owner->id,
            'status' => FollowStatus::Pending->value,
        ]);
    }
}
