<?php

namespace App\Services\Messaging;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use App\Notifications\DatabaseActivityNotification;
use App\Services\SocialGraph\SocialGraphService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ConversationService
{
    public function __construct(
        private readonly SocialGraphService $socialGraphService,
    ) {}

    public function inbox(User $user): Collection
    {
        $conversations = $user->conversations()
            ->with(['participants', 'latestMessage.sender'])
            ->orderByDesc('latest_message_at')
            ->orderByDesc('conversations.updated_at')
            ->get();

        if ($conversations->isNotEmpty()) {
            $this->markAsReceived($user, $conversations->modelKeys());
        }

        return $conversations;
    }

    public function startDirect(User $actor, User $target): Conversation
    {
        return DB::transaction(function () use ($actor, $target) {
            $now = now();
            $conversation = Conversation::query()->firstOrCreate(
                [
                    'direct_message_key' => $this->directMessageKey($actor, $target),
                ],
                [
                    'kind' => 'direct',
                ],
            );

            $conversation->participants()->syncWithoutDetaching([
                $actor->id => [
                    'last_read_at' => $now,
                    'last_received_at' => $now,
                ],
                $target->id => [
                    'last_read_at' => null,
                    'last_received_at' => null,
                ],
            ]);

            return $conversation->load(['participants', 'latestMessage.sender']);
        });
    }

    public function threadFor(User $user, Conversation $conversation): Conversation
    {
        $this->markAsReceived($user, [$conversation->id]);
        $this->markAsRead($user, $conversation);

        return $conversation->load([
            'participants',
            'latestMessage.sender',
            'messages.sender',
            'messages.conversation.participants',
        ]);
    }

    public function sendMessage(
        User $sender,
        Conversation $conversation,
        string $body,
        ?UploadedFile $attachment = null,
    ): Message {
        return DB::transaction(function () use ($sender, $conversation, $body, $attachment) {
            $message = $conversation->messages()->create([
                'user_id' => $sender->id,
                'body' => $body,
                ...$this->attachmentAttributes($attachment),
            ]);

            $conversation->forceFill([
                'latest_message_at' => $message->created_at,
            ])->save();

            $conversation->participants()->updateExistingPivot($sender->id, [
                'last_read_at' => $message->created_at,
                'last_received_at' => $message->created_at,
                'updated_at' => now(),
            ]);

            $conversation->participants()
                ->whereKeyNot($sender->id)
                ->get()
                ->each(fn (User $recipient) => $recipient->notify(new DatabaseActivityNotification([
                    'type' => 'message',
                    'title' => "{$sender->name} sent you a message",
                    'body' => str($body)->limit(100)->toString(),
                    'href' => route('messages.show', $conversation),
                    'actor' => $this->actorPayload($sender),
                ])));

            return $message->load('sender');
        });
    }

    public function updateMessage(Message $message, string $body): Message
    {
        $message->update([
            'body' => $body,
        ]);

        return $message->load('sender');
    }

    public function deleteMessage(Message $message): void
    {
        DB::transaction(function () use ($message) {
            $conversation = $message->conversation()->firstOrFail();
            $attachmentPath = $message->attachment_path;

            $message->delete();

            $latestMessage = $conversation->messages()->latest()->first();

            $conversation->forceFill([
                'latest_message_at' => $latestMessage?->created_at,
            ])->save();

            if ($attachmentPath) {
                Storage::disk('public')->delete($attachmentPath);
            }
        });
    }

    public function clearConversation(Conversation $conversation): Conversation
    {
        return DB::transaction(function () use ($conversation) {
            $attachmentPaths = $conversation->messages()
                ->whereNotNull('attachment_path')
                ->pluck('attachment_path')
                ->filter()
                ->all();

            $conversation->messages()->delete();

            $conversation->forceFill([
                'latest_message_at' => null,
            ])->save();

            if ($attachmentPaths !== []) {
                Storage::disk('public')->delete($attachmentPaths);
            }

            return $conversation->load(['participants', 'latestMessage.sender']);
        });
    }

    public function deleteConversationFor(User $user, Conversation $conversation): void
    {
        DB::transaction(function () use ($user, $conversation) {
            $shouldDeleteConversation = $conversation->participants()->count() <= 1;

            $conversation->participants()->detach($user->id);

            if ($shouldDeleteConversation) {
                $attachmentPaths = $conversation->messages()
                    ->whereNotNull('attachment_path')
                    ->pluck('attachment_path')
                    ->filter()
                    ->all();

                $conversation->delete();

                if ($attachmentPaths !== []) {
                    Storage::disk('public')->delete($attachmentPaths);
                }
            }
        });
    }

    public function markAsRead(User $user, Conversation $conversation): void
    {
        $conversation->participants()->updateExistingPivot($user->id, [
            'last_read_at' => now(),
            'last_received_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function markAsReceived(User $user, array $conversationIds): void
    {
        if ($conversationIds === []) {
            return;
        }

        DB::table('conversation_participants')
            ->where('user_id', $user->id)
            ->whereIn('conversation_id', $conversationIds)
            ->update([
                'last_received_at' => now(),
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

    private function attachmentAttributes(?UploadedFile $attachment): array
    {
        if (! $attachment) {
            return [];
        }

        return [
            'attachment_path' => $attachment->store('messages', 'public'),
            'attachment_name' => $attachment->getClientOriginalName(),
            'attachment_mime_type' => $attachment->getMimeType() ?? 'application/octet-stream',
            'attachment_size' => $attachment->getSize(),
        ];
    }

    private function actorPayload(User $actor): array
    {
        return [
            'id' => $actor->id,
            'name' => $actor->name,
            'username' => $actor->username,
            'avatar_url' => $actor->avatar_path
                ? route('media.public', ['path' => $actor->avatar_path])
                : null,
            'avatar_position_x' => $actor->avatar_position_x ?? 50,
            'avatar_position_y' => $actor->avatar_position_y ?? 50,
            'avatar_zoom' => $actor->avatar_zoom ?? 1,
        ];
    }
}
