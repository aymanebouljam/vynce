<?php

namespace Tests\Feature\Notifications;

use App\Models\Post;
use App\Models\User;
use App\Services\Messaging\ConversationService;
use App\Services\SocialGraph\SocialGraphService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TopbarNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_following_a_user_creates_an_unread_notification_badge(): void
    {
        $actor = User::factory()->create();
        $target = User::factory()->create([
            'username' => 'target-user',
        ]);

        $this->actingAs($actor)
            ->post(route('users.follow', $target))
            ->assertRedirect();

        $this->assertSame(1, $target->notifications()->count());

        $this->actingAs($target)
            ->get(route('feed.home'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('topbar.notifications_count', 1)
                ->where('topbar.notifications.0.type', 'follow'));
    }

    public function test_commenting_and_friend_requests_update_topbar_badges(): void
    {
        $owner = User::factory()->create([
            'username' => 'owner-user',
        ]);
        $commenter = User::factory()->create();
        $friendRequester = User::factory()->create();
        $post = Post::factory()->for($owner)->create([
            'visibility' => 'public',
        ]);

        $this->actingAs($commenter)
            ->post(route('posts.comments.store', $post), [
                'body' => 'Love this update.',
            ])
            ->assertRedirect();

        $this->actingAs($friendRequester)
            ->post(route('users.friend-requests.store', $owner))
            ->assertRedirect();

        $this->actingAs($owner)
            ->get(route('feed.home'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('topbar.notifications_count', 2)
                ->where('topbar.pending_requests_count', 1)
                ->where('topbar.notifications', fn ($notifications) => collect($notifications)
                    ->pluck('type')
                    ->intersect(['comment', 'friend_request'])
                    ->count() === 2));
    }

    public function test_receiving_a_message_updates_message_and_notification_badges(): void
    {
        $sender = User::factory()->create();
        $recipient = User::factory()->create();
        $conversationService = app(ConversationService::class);

        $conversation = $conversationService->startDirect($sender, $recipient);
        $conversationService->sendMessage($sender, $conversation, 'Checking in on this thread.');

        $this->assertSame(1, $recipient->notifications()->count());

        $this->actingAs($recipient)
            ->get(route('feed.home'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('topbar.unread_messages_count', 1)
                ->where('topbar.notifications_count', 1)
                ->where('topbar.notifications.0.type', 'message'));
    }

    public function test_opening_notification_read_endpoint_marks_notifications_as_read(): void
    {
        $actor = User::factory()->create();
        $target = User::factory()->create();

        app(SocialGraphService::class)->follow($actor, $target);

        $this->actingAs($target)
            ->postJson(route('notifications.read'))
            ->assertOk();

        $this->assertSame(0, $target->fresh()->unreadNotifications()->count());
    }
}
