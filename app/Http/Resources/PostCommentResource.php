<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Collection;

class PostCommentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'parent_id' => $this->parent_id,
            'body' => $this->body,
            'created_at' => optional($this->created_at)->toIso8601String(),
            'user' => $this->relationLoaded('user') && $this->user
                ? UserResource::make($this->user)->resolve($request)
                : null,
            'replies' => $this->relationLoaded('children')
                ? self::collection($this->children)
                : [],
        ];
    }

    public static function tree(Collection $comments, Request $request, int $topLevelLimit = 5): array
    {
        $grouped = $comments
            ->sortBy('created_at')
            ->groupBy(fn ($comment) => $comment->parent_id ?? 0);

        return self::branch($grouped, 0, $request, $topLevelLimit);
    }

    private static function branch(Collection $grouped, int $parentId, Request $request, ?int $limit = null): array
    {
        $children = $grouped->get($parentId, collect());

        if ($limit !== null) {
            $children = $children->take($limit);
        }

        return $children
            ->values()
            ->map(fn ($comment) => [
                'id' => $comment->id,
                'parent_id' => $comment->parent_id,
                'body' => $comment->body,
                'created_at' => optional($comment->created_at)->toIso8601String(),
                'user' => $comment->relationLoaded('user') && $comment->user
                    ? UserResource::make($comment->user)->resolve($request)
                    : null,
                'replies' => self::branch($grouped, $comment->id, $request),
            ])
            ->all();
    }
}
