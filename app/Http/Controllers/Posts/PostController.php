<?php

namespace App\Http\Controllers\Posts;

use App\Actions\Posts\CreatePostAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Posts\StorePostRequest;
use App\Http\Requests\Posts\UpdatePostRequest;
use App\Http\Resources\PostResource;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

class PostController extends Controller
{
    public function store(
        StorePostRequest $request,
        CreatePostAction $createPostAction,
    ): RedirectResponse {
        $this->authorize('create', Post::class);

        $post = $createPostAction->execute($request->user(), $request->validated());

        return back()->with('new_post_id', $post->id);
    }

    public function update(UpdatePostRequest $request, Post $post): RedirectResponse|JsonResponse
    {
        $this->authorize('update', $post);

        preg_match_all('/#([\pL\pN_]+)/u', $request->string('body')->value(), $hashtags);
        preg_match_all('/@([a-z0-9_.]+)/i', $request->string('body')->value(), $mentions);

        $post->update([
            'body' => $request->string('body')->value(),
            'visibility' => $request->string('visibility')->value(),
            'hashtags' => array_values(array_unique(array_map('mb_strtolower', $hashtags[1] ?? []))),
            'mentions' => array_values(array_unique(array_map('strtolower', $mentions[1] ?? []))),
        ]);

        if ($request->expectsJson()) {
            return response()->json([
                'post' => PostResource::make(
                    $post->fresh(['user', 'media', 'comments.user', 'likes', 'reposts']),
                )->resolve($request),
            ]);
        }

        return back();
    }

    public function destroy(Post $post): RedirectResponse
    {
        $this->authorize('delete', $post);

        DB::transaction(function () use ($post) {
            $post->media()->delete();
            $post->delete();
        });

        return back();
    }
}
