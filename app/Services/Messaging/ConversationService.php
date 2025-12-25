<?php

namespace App\Services\Messaging;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use App\Services\SocialGraph\SocialGraphService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class ConversationService
{
    public function __construct(
        private readonly SocialGraphService $socialGraphService,
    ) {}

    public function inbox(User $user): Collection
    {
        return $user->conversations()
            ->with(['participants', 'latestMessage.sender'])
            ->orderByDesc('latest_message_at')
            ->orderByDesc('conversations.updated_at')
            ->get();
    }

    public function startDirect(User $actor, User $target): Conversation
    {
        return DB::transaction(function () use ($actor, $target) {
            $conversation = Conversation::query()->firstOrCreate(
                [
                    'direct_message_key' => $this->directMessageKey($actor, $target),
                ],
                [
                    'kind' => 'direct',
                ],
            );

            $conversation->participants()->syncWithoutDetaching([
                $actor->id => ['last_read_at' => now()],
                $target->id => ['last_read_at' => null],
            ]);

            return $conversation->load(['participants', 'latestMessage.sender']);
        });
    }

    public function threadFor(User $user, Conversation $conversation): Conversation
    {
        $this->markAsRead($user, $conversation);

        return $conversation->load([
            'participants',
            'latestMessage.sender',
            'messages.sender',
        ]);
    }

    public function sendMessage(User $sender, Conversation $conversation, string $body): Message
    {
        return DB::transaction(function () use ($sender, $conversation, $body) {
            $message = $conversation->messages()->create([
                'user_id' => $sender->id,
                'body' => $body,
            ]);

            $conversation->forceFill([
                'latest_message_at' => $message->created_at,
            ])->save();

            $conversation->participants()->updateExistingPivot($sender->id, [
                'last_read_at' => $message->created_at,
                'updated_at' => now(),
            ]);

            return $message->load('sender');
        });
    }

    public function markAsRead(User $user, Conversation $conversation): void
    {
        $conversation->participants()->updateExistingPivot($user->id, [
            'last_read_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function canDirectMessage(User $actor, User $target): bool
    {
        return ! $actor->is($target)
            && ! $this->socialGraphService->hasBlockBetween($actor, $target);
    }

    private function directMessageKey(User $first, User $second): string
    {
        $ids = [$first->id, $second->id];
        sort($ids);

        return sprintf('direct:%d:%d', $ids[0], $ids[1]);
    }
}
