<?php

namespace App\Http\Controllers\Posts;

use App\Http\Controllers\Controller;
use App\Http\Requests\Posts\StoreCommentRequest;
use App\Models\Post;
use App\Notifications\DatabaseActivityNotification;
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
            $comment = $post->comments()->create([
                'user_id' => $request->user()->id,
                'body' => $request->string('body')->toString(),
            ]);

            $post->increment('comments_count');

            $post->loadMissing('user');

            if (! $post->user->is($request->user())) {
                $post->user->notify(new DatabaseActivityNotification([
                    'type' => 'comment',
                    'title' => "{$request->user()->name} commented on your post",
                    'body' => str($comment->body)->limit(100)->toString(),
                    'href' => route('users.show', [
                        'user' => $post->user->username,
                        'post' => $post->id,
                        'comments' => 1,
                    ]),
                    'actor' => [
                        'id' => $request->user()->id,
                        'name' => $request->user()->name,
                        'username' => $request->user()->username,
                        'avatar_url' => $request->user()->avatar_path
                            ? route('media.public', ['path' => $request->user()->avatar_path])
                            : null,
                        'avatar_position_x' => $request->user()->avatar_position_x ?? 50,
                        'avatar_position_y' => $request->user()->avatar_position_y ?? 50,
                        'avatar_zoom' => $request->user()->avatar_zoom ?? 1,
                    ],
                ]));
            }
        });

        return back();
    }
}
