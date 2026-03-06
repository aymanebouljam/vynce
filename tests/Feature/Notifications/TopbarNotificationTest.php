<?php

namespace Tests\Feature\Notifications;

use App\Http\Controllers\NotificationController;
use App\Models\Post;
use App\Models\User;
use App\Notifications\DatabaseActivityNotification;
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
                ->where('topbar.notifications_count', 1)
                ->where('topbar.pending_requests_count', 1)
                ->where('topbar.notifications.0.href', route('users.show', [
                    'user' => $owner->username,
                    'post' => $post->id,
                    'comments' => 1,
                ]))
                ->where('topbar.notifications', fn ($notifications) => collect($notifications)
                    ->pluck('type')
                    ->intersect(['comment'])
                    ->count() === 1));
    }

    public function test_likes_and_reposts_create_bell_notifications_for_the_post_owner(): void
    {
        $owner = User::factory()->create([
            'username' => 'owner-user',
        ]);
        $actor = User::factory()->create();
        $post = Post::factory()->for($owner)->create([
            'visibility' => 'public',
        ]);

        $this->actingAs($actor)
            ->post(route('posts.likes.toggle', $post))
            ->assertRedirect();

        $this->actingAs($actor)
            ->post(route('posts.reposts.toggle', $post))
            ->assertRedirect();

        $this->actingAs($owner)
            ->get(route('feed.home'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('topbar.notifications_count', 2)
                ->where('topbar.notifications', fn ($notifications) => collect($notifications)
                    ->pluck('type')
                    ->intersect(['like', 'repost'])
                    ->count() === 2));

        $this->assertSame(
            route('users.show', [
                'user' => $owner->username,
                'post' => $post->id,
            ]),
            $owner->fresh()->notifications()->where('data->type', 'like')->firstOrFail()->data['href'],
        );

        $this->assertSame(
            route('users.show', [
                'user' => $actor->username,
                'post' => $post->id,
            ]),
            $owner->fresh()->notifications()->where('data->type', 'repost')->firstOrFail()->data['href'],
        );
    }

    public function test_mentions_in_posts_and_comments_create_bell_notifications_with_deep_links(): void
    {
        $postAuthor = User::factory()->create([
            'username' => 'post_author',
        ]);
        $postMentioned = User::factory()->create([
            'username' => 'post_mentioned',
        ]);
        $commentMentioned = User::factory()->create([
            'username' => 'comment_mentioned',
        ]);
        $commentAuthor = User::factory()->create([
            'username' => 'comment_author',
        ]);
        $post = Post::factory()->for($postAuthor)->create([
            'visibility' => 'public',
        ]);

        $this->actingAs($commentAuthor)
            ->post(route('posts.store'), [
                'body' => 'Shout out to @post_mentioned on this one.',
                'visibility' => 'public',
            ])
            ->assertRedirect();

        $createdPost = Post::query()->latest('id')->firstOrFail();

        $this->actingAs($commentAuthor)
            ->post(route('posts.comments.store', $post), [
                'body' => 'Hello @comment_mentioned, check this out.',
            ])
            ->assertRedirect();

        $createdComment = $post->comments()->latest('id')->firstOrFail();

        $this->assertSame(1, $postMentioned->fresh()->notifications()->count());
        $this->assertSame(1, $commentMentioned->fresh()->notifications()->count());

        $this->assertSame(
            route('users.show', [
                'user' => $createdPost->user->username,
                'post' => $createdPost->id,
            ]),
            $postMentioned->fresh()->notifications()->firstOrFail()->data['href'],
        );

        $this->assertSame(
            route('users.show', [
                'user' => $postAuthor->username,
                'post' => $post->id,
                'comments' => 1,
                'comment_id' => $createdComment->id,
            ]),
            $commentMentioned->fresh()->notifications()->firstOrFail()->data['href'],
        );
    }

    public function test_adding_a_mention_to_an_existing_post_notifies_that_user_with_a_post_link(): void
    {
        $author = User::factory()->create([
            'username' => 'post_author',
        ]);
        $mentioned = User::factory()->create([
            'username' => 'mentioned_user',
        ]);
        $post = Post::factory()->for($author)->create([
            'visibility' => 'public',
            'body' => 'Initial body without mentions.',
            'mentions' => [],
        ]);

        $this->actingAs($author)
            ->patch(route('posts.update', $post), [
                'body' => 'Updated body with @mentioned_user now included.',
                'visibility' => 'public',
            ])
            ->assertRedirect();

        $notification = $mentioned->fresh()->notifications()->firstOrFail();

        $this->assertSame('mention', $notification->data['type']);
        $this->assertSame(
            route('users.show', [
                'user' => $author->username,
                'post' => $post->id,
            ]),
            $notification->data['href'],
        );
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
                ->where('topbar.notifications_count', 0));
    }

    public function test_message_badge_counts_total_unread_messages_not_just_conversations(): void
    {
        $sender = User::factory()->create();
        $recipient = User::factory()->create();
        $conversationService = app(ConversationService::class);

        $conversation = $conversationService->startDirect($sender, $recipient);
        $conversationService->sendMessage($sender, $conversation, 'First unread message.');
        $conversationService->sendMessage($sender, $conversation, 'Second unread message.');

        $this->actingAs($recipient)
            ->get(route('feed.home'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('topbar.unread_messages_count', 2)
                ->where('topbar.notifications_count', 0));
    }

    public function test_accepting_a_friend_request_creates_a_bell_notification_for_the_requester(): void
    {
        $requester = User::factory()->create(['username' => 'requester-user']);
        $recipient = User::factory()->create(['username' => 'recipient-user']);

        $this->actingAs($requester)
            ->post(route('users.friend-requests.store', $recipient))
            ->assertRedirect();

        $this->actingAs($recipient)
            ->post(route('users.friend-requests.accept', $requester))
            ->assertRedirect();

        $this->actingAs($requester)
            ->get(route('feed.home'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('topbar.notifications_count', 1)
                ->where('topbar.notifications.0.type', 'friend_request_accepted'));
    }

    public function test_opening_notification_read_endpoint_marks_notifications_as_read(): void
    {
        $actor = User::factory()->create();
        $target = User::factory()->create();

        app(SocialGraphService::class)->follow($actor, $target);

        $this->actingAs($target)
            ->postJson(route('notifications.read'), ['category' => 'bell'])
            ->assertOk();

        $this->assertSame(0, $target->fresh()->unreadNotifications()->count());
    }

    public function test_a_user_can_remove_a_single_notification(): void
    {
        $actor = User::factory()->create();
        $target = User::factory()->create();

        app(SocialGraphService::class)->follow($actor, $target);
        $notificationId = $target->notifications()->firstOrFail()->id;

        $this->actingAs($target)
            ->deleteJson(route('notifications.destroy', $notificationId), ['category' => 'bell'])
            ->assertOk();

        $this->assertSame(0, $target->fresh()->notifications()->count());
    }

    public function test_a_user_can_clear_all_notifications(): void
    {
        $owner = User::factory()->create();
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

        $this->assertSame(2, $owner->notifications()->count());

        $this->actingAs($owner)
            ->deleteJson(route('notifications.clear'), ['category' => 'bell'])
            ->assertOk();

        $owner = $owner->fresh();

        $this->assertSame(1, $owner->notifications()->count());
        $this->assertSame(0, NotificationController::queryForCategory(
            $owner->notifications(),
            'bell',
        )->count());
    }

    public function test_notifications_index_returns_paginated_results(): void
    {
        $user = User::factory()->create();

        foreach (range(1, 9) as $index) {
            $user->notify(new DatabaseActivityNotification([
                'type' => 'follow',
                'title' => "Notification {$index}",
                'body' => 'Body',
                'href' => route('feed.home'),
                'actor' => null,
            ]));
        }

        $this->actingAs($user)
            ->getJson(route('notifications.index', ['page' => 2, 'category' => 'bell']))
            ->assertOk()
            ->assertJsonCount(4, 'notifications')
            ->assertJson([
                'page' => 2,
                'has_more' => true,
            ]);
    }

    public function test_friend_request_notifications_are_paginated(): void
    {
        $recipient = User::factory()->create();

        foreach (range(1, 5) as $index) {
            $requester = User::factory()->create([
                'username' => "requester-{$index}",
            ]);

            $this->actingAs($requester)
                ->post(route('users.friend-requests.store', $recipient))
                ->assertRedirect();
        }

        $this->actingAs($recipient)
            ->getJson(route('notifications.index', ['page' => 2, 'category' => 'requests']))
            ->assertOk()
            ->assertJsonCount(1, 'notifications')
            ->assertJson([
                'page' => 2,
                'has_more' => false,
            ]);
    }

    public function test_opening_requests_marks_friend_request_notifications_as_read_without_touching_bell_notifications(): void
    {
        $owner = User::factory()->create();
        $friendRequester = User::factory()->create();
        $follower = User::factory()->create();

        $this->actingAs($friendRequester)
            ->post(route('users.friend-requests.store', $owner))
            ->assertRedirect();

        $this->actingAs($follower)
            ->post(route('users.follow', $owner))
            ->assertRedirect();

        $this->actingAs($owner)
            ->postJson(route('notifications.read'), ['category' => 'requests'])
            ->assertOk();

        $owner = $owner->fresh();

        $this->assertSame(1, NotificationController::queryForCategory(
            $owner->unreadNotifications(),
            'bell',
        )->count());
        $this->assertSame(0, NotificationController::queryForCategory(
            $owner->unreadNotifications(),
            'requests',
        )->count());
    }
}
