<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'username' => $this->username,
            'email' => $this->when($request->user()?->is($this->resource), $this->email),
            'bio' => $this->bio,
            'website_url' => $this->website_url,
            'location' => $this->location,
            'is_private' => $this->is_private,
            'role' => $this->role?->value ?? $this->role,
            'avatar_url' => $this->avatar_path ? Storage::disk('public')->url($this->avatar_path) : null,
            'cover_url' => $this->cover_path ? Storage::disk('public')->url($this->cover_path) : null,
            'onboarding_completed_at' => $this->onboarding_completed_at,
            'followers_count' => $this->whenCounted('acceptedFollowers', $this->accepted_followers_count ?? $this->followers_count),
            'following_count' => $this->whenCounted('acceptedFollowing', $this->accepted_following_count ?? $this->following_count),
            'posts_count' => $this->whenCounted('posts'),
        ];
    }
}
