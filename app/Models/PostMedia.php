<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PostMedia extends Model
{
    use HasFactory;

    protected $fillable = [
        'post_id',
        'disk',
        'path',
        'mime_type',
        'size',
        'position',
    ];

    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }
}
