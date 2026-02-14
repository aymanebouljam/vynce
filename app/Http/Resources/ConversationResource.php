<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConversationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $viewer = $request->user();

        $otherParticipant = $this->participants
            ->first(fn (User $participant) => ! $viewer || ! $participant->is($viewer));

        return [
            'id' => $this->id,
            'kind' => $this->kind,
            'latest_message_at' => optional($this->latest_message_at)->toIso8601String(),
            'updated_at' => optional($this->updated_at)->toIso8601String(),
            'participant' => $otherParticipant
                ? UserResource::make($otherParticipant)->resolve($request)
                : null,
            'latest_message' => $this->relationLoaded('latestMessage') && $this->latestMessage
                ? MessageResource::make($this->latestMessage)->resolve($request)
                : null,
        ];
    }
}
