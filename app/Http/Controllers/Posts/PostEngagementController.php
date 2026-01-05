<?php

namespace App\Http\Controllers\Posts;

use App\Http\Controllers\Controller;
use App\Http\Requests\Posts\StoreCommentRequest;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

class PostEngagementController extends Controller
{
    public function toggleLike(Post $post): RedirectResponse|JsonResponse
    {
        $this->authorize('view', $post);

        $liked = DB::transaction(function () use ($post) {
            $like = $post->likes()->where('user_id', request()->user()->id)->first();

            if ($like) {
                $like->delete();
                $post->decrement('likes_count');

                return false;
            }

            $post->likes()->create([
                'user_id' => request()->user()->id,
            ]);
            $post->increment('likes_count');

            return true;
        });

        $post->refresh();

        if (request()->expectsJson()) {
            return response()->json([
                'liked' => $liked,
                'likes_count' => $post->likes_count,
            ]);
        }

        return back();
    }

    public function toggleRepost(Post $post): RedirectResponse
    {
        $this->authorize('view', $post);

        DB::transaction(function () use ($post) {
            $repost = $post->reposts()->where('user_id', request()->user()->id)->first();

            if ($repost) {
                $repost->delete();
                $post->decrement('reposts_count');

                return;
            }

            $post->reposts()->create([
                'user_id' => request()->user()->id,
            ]);
            $post->increment('reposts_count');
        });

        return back();
    }

    public function storeComment(StoreCommentRequest $request, Post $post): RedirectResponse
    {
        $this->authorize('view', $post);

        DB::transaction(function () use ($request, $post) {
            $post->comments()->create([
                'user_id' => $request->user()->id,
                'body' => $request->string('body')->toString(),
            ]);

            $post->increment('comments_count');
        });

        return back();
    }
}
