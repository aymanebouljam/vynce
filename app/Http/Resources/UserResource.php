<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

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
            'avatar_url' => $this->avatar_path ? route('media.public', ['path' => $this->avatar_path]) : null,
            'cover_url' => $this->cover_path ? route('media.public', ['path' => $this->cover_path]) : null,
            'onboarding_completed_at' => $this->onboarding_completed_at,
            'friends_count' => $this->when(isset($this->friends_count), $this->friends_count),
            'followers_count' => $this->whenCounted('acceptedFollowers', $this->accepted_followers_count ?? $this->followers_count),
            'following_count' => $this->whenCounted('acceptedFollowing', $this->accepted_following_count ?? $this->following_count),
            'posts_count' => $this->whenCounted('posts'),
        ];
    }
}
