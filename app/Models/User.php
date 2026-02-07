<?php

namespace App\Models;

use App\Enums\FollowStatus;
use App\Enums\FriendshipStatus;
use App\Enums\UserRole;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'bio',
        'avatar_path',
        'avatar_zoom',
        'avatar_position_x',
        'avatar_position_y',
        'cover_path',
        'cover_zoom',
        'cover_position_x',
        'cover_position_y',
        'website_url',
        'location',
        'is_private',
        'role',
        'onboarding_completed_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_private' => 'boolean',
            'avatar_zoom' => 'float',
            'cover_zoom' => 'float',
            'avatar_position_x' => 'integer',
            'avatar_position_y' => 'integer',
            'cover_position_x' => 'integer',
            'cover_position_y' => 'integer',
            'role' => UserRole::class,
            'onboarding_completed_at' => 'datetime',
            'suspended_at' => 'datetime',
        ];
    }

    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }

    public function conversations(): BelongsToMany
    {
        return $this->belongsToMany(Conversation::class, 'conversation_participants')
            ->withPivot(['last_read_at', 'last_received_at'])
            ->withTimestamps();
    }

    public function sentMessages(): HasMany
    {
        return $this->hasMany(Message::class, 'user_id');
    }

    public function followingRelations(): HasMany
    {
        return $this->hasMany(Follow::class, 'follower_id');
    }

    public function followerRelations(): HasMany
    {
        return $this->hasMany(Follow::class, 'followed_id');
    }

    public function blocks(): HasMany
    {
        return $this->hasMany(UserBlock::class, 'blocker_id');
    }

    public function mutedUsers(): HasMany
    {
        return $this->hasMany(UserMute::class, 'muter_id');
    }

    public function acceptedFollowers(): HasMany
    {
        return $this->followerRelations()->where('status', FollowStatus::Accepted);
    }

    public function acceptedFollowing(): HasMany
    {
        return $this->followingRelations()->where('status', FollowStatus::Accepted);
    }

    public function pendingFollowRequests(): HasMany
    {
        return $this->followerRelations()->where('status', FollowStatus::Pending);
    }

    public function sentFriendships(): HasMany
    {
        return $this->hasMany(Friendship::class, 'requester_id');
    }

    public function receivedFriendships(): HasMany
    {
        return $this->hasMany(Friendship::class, 'addressee_id');
    }

    public function acceptedFriendshipsSent(): HasMany
    {
        return $this->sentFriendships()->where('status', FriendshipStatus::Accepted);
    }

    public function acceptedFriendshipsReceived(): HasMany
    {
        return $this->receivedFriendships()->where('status', FriendshipStatus::Accepted);
    }

    public function pendingFriendRequests(): HasMany
    {
        return $this->receivedFriendships()->where('status', FriendshipStatus::Pending);
    }

    public function mediaPosts(): HasManyThrough
    {
        return $this->hasManyThrough(PostMedia::class, Post::class);
    }

    public function isAdmin(): bool
    {
        return $this->role === UserRole::Admin;
    }
}
