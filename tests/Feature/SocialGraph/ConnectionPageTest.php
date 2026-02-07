<?php

namespace Tests\Feature\SocialGraph;

use App\Enums\FollowStatus;
use App\Models\Follow;
use App\Models\Friendship;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConnectionPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_followers_page_lists_accepted_followers(): void
    {
        $owner = User::factory()->create();
        $follower = User::factory()->create(['name' => 'Follower One']);

        Follow::query()->create([
            'follower_id' => $follower->id,
            'followed_id' => $owner->id,
            'status' => FollowStatus::Accepted,
            'accepted_at' => now(),
        ]);

        $this->actingAs($owner)
            ->get(route('users.followers', $owner->username))
            ->assertOk()
            ->assertSee('Follower One');
    }

    public function test_following_page_lists_accepted_following(): void
    {
        $owner = User::factory()->create();
        $followed = User::factory()->create(['name' => 'Followed Person']);

        Follow::query()->create([
            'follower_id' => $owner->id,
            'followed_id' => $followed->id,
            'status' => FollowStatus::Accepted,
            'accepted_at' => now(),
        ]);

        $this->actingAs($owner)
            ->get(route('users.following', $owner->username))
            ->assertOk()
            ->assertSee('Followed Person');
    }

    public function test_friends_page_lists_mutual_connections_only(): void
    {
        $owner = User::factory()->create();
        $friend = User::factory()->create(['name' => 'Mutual Friend']);
        $oneWay = User::factory()->create(['name' => 'One Way Follow']);

        Friendship::query()->create([
            'requester_id' => $owner->id,
            'addressee_id' => $friend->id,
            'status' => 'accepted',
            'accepted_at' => now(),
        ]);

        Follow::query()->create([
            'follower_id' => $owner->id,
            'followed_id' => $oneWay->id,
            'status' => FollowStatus::Accepted,
            'accepted_at' => now(),
        ]);

        $this->actingAs($owner)
            ->get(route('users.friends', $owner->username))
            ->assertOk()
            ->assertSee('Mutual Friend')
            ->assertDontSee('One Way Follow');
    }
}
