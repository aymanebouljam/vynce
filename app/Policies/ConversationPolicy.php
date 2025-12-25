<?php

namespace App\Policies;

use App\Models\Conversation;
use App\Models\User;

class ConversationPolicy
{
    public function view(User $user, Conversation $conversation): bool
    {
        if ($conversation->relationLoaded('participants')) {
            return $conversation->participants->contains(fn (User $participant) => $participant->is($user));
        }

        return $conversation->participants()
            ->where('users.id', $user->id)
            ->exists();
    }
}
