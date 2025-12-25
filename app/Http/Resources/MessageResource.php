<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'body' => $this->body,
            'created_at' => optional($this->created_at)->toIso8601String(),
            'sender' => $this->relationLoaded('sender') && $this->sender
                ? UserResource::make($this->sender)->resolve($request)
                : null,
        ];
    }
}
