<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

class PostResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $this->relationLoaded('user') && $this->user
            ? UserResource::make($this->user)->resolve($request)
            : null;

        return [
            'id' => $this->id,
            'body' => $this->body,
            'visibility' => $this->visibility?->value ?? $this->visibility,
            'hashtags' => $this->hashtags ?? [],
            'mentions' => $this->mentions ?? [],
            'likes_count' => $this->likes_count,
            'comments_count' => $this->comments_count,
            'reposts_count' => $this->reposts_count,
            'is_liked' => $request->user() ? $this->likes->contains('user_id', $request->user()->id) : false,
            'is_reposted' => $request->user() ? $this->reposts->contains('user_id', $request->user()->id) : false,
            'profile_reposted_at' => $this->profile_reposted_at
                ? Carbon::parse($this->profile_reposted_at)->toIso8601String()
                : null,
            'published_at' => optional($this->published_at)->toIso8601String(),
            'created_at' => optional($this->created_at)->toIso8601String(),
            'user' => $user,
            'media' => $this->media->map(fn ($media) => [
                'id' => $media->id,
                'url' => route('media.public', ['path' => $media->path]),
                'mime_type' => $media->mime_type,
                'zoom' => $media->zoom ?? 1,
                'position_x' => $media->position_x ?? 50,
                'position_y' => $media->position_y ?? 50,
                'position' => $media->position,
            ])->values(),
            'comments' => $this->comments->take(5)->map(fn ($comment) => [
                'id' => $comment->id,
                'body' => $comment->body,
                'created_at' => optional($comment->created_at)->toIso8601String(),
                'user' => $comment->relationLoaded('user') && $comment->user
                    ? UserResource::make($comment->user)->resolve($request)
                    : null,
            ])->values(),
        ];
    }
}
