<?php

namespace Tests\Feature\SocialGraph;

use App\Enums\FriendshipStatus;
use App\Models\Friendship;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FriendshipSystemTest extends TestCase
{
    use RefreshDatabase;

    public function test_users_can_send_friend_requests(): void
    {
        $actor = User::factory()->create();
        $target = User::factory()->create();

        $this->actingAs($actor)
            ->post(route('users.friend-requests.store', $target))
            ->assertRedirect();

        $this->assertDatabaseHas('friendships', [
            'requester_id' => $actor->id,
            'addressee_id' => $target->id,
            'status' => FriendshipStatus::Pending->value,
        ]);
    }

    public function test_users_can_accept_friend_requests(): void
    {
        $requester = User::factory()->create();
        $owner = User::factory()->create();

        Friendship::query()->create([
            'requester_id' => $requester->id,
            'addressee_id' => $owner->id,
            'status' => FriendshipStatus::Pending,
        ]);

        $this->actingAs($owner)
            ->post(route('users.friend-requests.accept', $requester))
            ->assertRedirect();

        $this->assertDatabaseHas('friendships', [
            'requester_id' => $requester->id,
            'addressee_id' => $owner->id,
            'status' => FriendshipStatus::Accepted->value,
        ]);
    }

    public function test_users_can_reject_friend_requests(): void
    {
        $requester = User::factory()->create();
        $owner = User::factory()->create();

        Friendship::query()->create([
            'requester_id' => $requester->id,
            'addressee_id' => $owner->id,
            'status' => FriendshipStatus::Pending,
        ]);

        $this->actingAs($owner)
            ->delete(route('users.friend-requests.reject', $requester))
            ->assertRedirect();

        $this->assertDatabaseMissing('friendships', [
            'requester_id' => $requester->id,
            'addressee_id' => $owner->id,
        ]);
    }
}
