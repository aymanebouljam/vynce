<?php

namespace App\Services\Notifications;

use App\Models\Post;
use App\Models\PostComment;
use App\Models\User;
use App\Notifications\DatabaseActivityNotification;

class MentionNotificationService
{
    public function notifyPostMentions(User $actor, Post $post, string $body): void
    {
        $this->notifyMentions(
            actor: $actor,
            body: $body,
            title: "{$actor->name} mentioned you in a post",
            href: route('users.show', [
                'user' => $post->user->username,
                'post' => $post->id,
            ]),
        );
    }

    public function notifyCommentMentions(User $actor, Post $post, PostComment $comment, string $body): void
    {
        $this->notifyMentions(
            actor: $actor,
            body: $body,
            title: "{$actor->name} mentioned you in a comment",
            href: route('users.show', [
                'user' => $post->user->username,
                'post' => $post->id,
                'comments' => 1,
                'comment_id' => $comment->id,
            ]),
        );
    }

    private function notifyMentions(User $actor, string $body, string $title, string $href): void
    {
        $mentionedUsers = $this->mentionedUsers($body)
            ->reject(fn (User $user) => $user->is($actor))
            ->values();

        if ($mentionedUsers->isEmpty()) {
            return;
        }

        foreach ($mentionedUsers as $mentionedUser) {
            $mentionedUser->notify(new DatabaseActivityNotification([
                'type' => 'mention',
                'title' => $title,
                'body' => str($body)->limit(100)->toString(),
                'href' => $href,
                'actor' => $this->actorPayload($actor),
            ]));
        }
    }

    private function mentionedUsers(string $body)
    {
        preg_match_all('/@([a-z0-9_.]+)/i', $body, $matches);

        return collect(array_values(array_unique(array_map('strtolower', $matches[1] ?? []))))
            ->map(fn (string $username) => User::query()
                ->whereRaw('LOWER(username) = ?', [$username])
                ->first())
            ->filter();
    }

    private function actorPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'avatar_url' => $user->avatar_path
                ? route('media.public', ['path' => $user->avatar_path])
                : null,
            'avatar_position_x' => $user->avatar_position_x ?? 50,
            'avatar_position_y' => $user->avatar_position_y ?? 50,
            'avatar_zoom' => $user->avatar_zoom ?? 1,
        ];
    }
}
