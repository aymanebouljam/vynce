<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class PostResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'body' => $this->body,
            'visibility' => $this->visibility?->value ?? $this->visibility,
            'hashtags' => $this->hashtags ?? [],
            'mentions' => $this->mentions ?? [],
            'published_at' => optional($this->published_at)->toIso8601String(),
            'created_at' => optional($this->created_at)->toIso8601String(),
            'user' => UserResource::make($this->whenLoaded('user')),
            'media' => $this->media->map(fn ($media) => [
                'id' => $media->id,
                'url' => Storage::disk($media->disk)->url($media->path),
                'mime_type' => $media->mime_type,
                'position' => $media->position,
            ])->values(),
        ];
    }
}
