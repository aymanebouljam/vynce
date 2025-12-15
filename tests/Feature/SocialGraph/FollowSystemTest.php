<?php

namespace Tests\Feature\SocialGraph;

use App\Enums\FollowStatus;
use App\Models\Follow;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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

    public function test_private_profiles_cannot_be_viewed_by_non_followers(): void
    {
        $viewer = User::factory()->create();
        $target = User::factory()->create(['is_private' => true]);

        $this->actingAs($viewer)
            ->get(route('users.show', $target->username))
            ->assertForbidden();
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
}
