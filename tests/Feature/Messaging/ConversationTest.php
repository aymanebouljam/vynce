<?php

namespace Tests\Feature\Messaging;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use App\Models\UserBlock;
use App\Services\Messaging\ConversationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConversationTest extends TestCase
{
    use RefreshDatabase;

    public function test_users_can_start_and_send_messages_in_a_direct_conversation(): void
    {
        $sender = User::factory()->create();
        $recipient = User::factory()->create();

        $response = $this->actingAs($sender)
            ->post(route('messages.start', $recipient));

        $conversation = Conversation::query()->first();

        $response->assertRedirect(route('messages.show', $conversation));
        $this->assertNotNull($conversation);

        $this->actingAs($sender)
            ->post(route('messages.messages.store', $conversation), [
                'body' => 'Hey, want to compare launch notes?',
            ])
            ->assertRedirect(route('messages.show', $conversation));

        $message = Message::query()->first();

        $this->assertSame($conversation->id, $message->conversation_id);
        $this->assertSame($sender->id, $message->user_id);
        $this->assertSame('Hey, want to compare launch notes?', $message->body);
    }

    public function test_recipient_can_see_new_direct_conversation_in_the_inbox(): void
    {
        $sender = User::factory()->create();
        $recipient = User::factory()->create();
        $conversationService = app(ConversationService::class);

        $conversation = $conversationService->startDirect($sender, $recipient);
        $conversationService->sendMessage($sender, $conversation, 'Hello Julia.');

        $this->actingAs($recipient)
            ->get(route('messages.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('conversations.0.id', $conversation->id)
                ->where('conversations.0.latest_message.body', 'Hello Julia.')
                ->where('conversations.0.participant.id', $sender->id));
    }

    public function test_blocked_users_cannot_start_direct_conversations(): void
    {
        $sender = User::factory()->create();
        $recipient = User::factory()->create();

        UserBlock::query()->create([
            'blocker_id' => $recipient->id,
            'blocked_id' => $sender->id,
        ]);

        $this->actingAs($sender)
            ->post(route('messages.start', $recipient))
            ->assertForbidden();
    }

    public function test_non_participants_cannot_view_other_peoples_conversations(): void
    {
        $first = User::factory()->create();
        $second = User::factory()->create();
        $outsider = User::factory()->create();

        $conversation = app(ConversationService::class)->startDirect($first, $second);

        $this->actingAs($outsider)
            ->get(route('messages.show', $conversation))
            ->assertForbidden();
    }

    public function test_viewing_a_conversation_marks_it_as_read_for_the_viewer(): void
    {
        $viewer = User::factory()->create();
        $other = User::factory()->create();

        $conversation = app(ConversationService::class)->startDirect($viewer, $other);

        $conversation->participants()->updateExistingPivot($viewer->id, [
            'last_read_at' => null,
            'updated_at' => now(),
        ]);

        $conversation->messages()->create([
            'user_id' => $other->id,
            'body' => 'Checking in on the thread.',
        ]);

        $this->actingAs($viewer)
            ->get(route('messages.show', $conversation))
            ->assertOk();

        $pivot = $conversation->participants()
            ->where('users.id', $viewer->id)
            ->first()
            ->pivot;

        $this->assertNotNull($pivot->last_read_at);
    }
}
