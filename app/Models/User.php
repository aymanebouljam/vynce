<?php

namespace App\Models;

use App\Enums\FollowStatus;
use App\Enums\UserRole;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'bio',
        'avatar_path',
        'cover_path',
        'website_url',
        'location',
        'is_private',
        'role',
        'onboarding_completed_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_private' => 'boolean',
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
            ->withPivot(['last_read_at'])
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

    public function mediaPosts(): HasManyThrough
    {
        return $this->hasManyThrough(PostMedia::class, Post::class);
    }

    public function isAdmin(): bool
    {
        return $this->role === UserRole::Admin;
    }
}
