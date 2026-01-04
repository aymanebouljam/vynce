<?php

namespace App\Models;

use App\Enums\PostVisibility;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Post extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'body',
        'visibility',
        'hashtags',
        'mentions',
        'likes_count',
        'comments_count',
        'reposts_count',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'visibility' => PostVisibility::class,
            'hashtags' => 'array',
            'mentions' => 'array',
            'published_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function media(): HasMany
    {
        return $this->hasMany(PostMedia::class)->orderBy('position');
    }

    public function likes(): HasMany
    {
        return $this->hasMany(PostLike::class);
    }

    public function reposts(): HasMany
    {
        return $this->hasMany(PostRepost::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(PostComment::class)->latest();
    }
}
