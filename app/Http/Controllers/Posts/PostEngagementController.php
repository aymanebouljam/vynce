<?php

namespace App\Http\Controllers\Posts;

use App\Http\Controllers\Controller;
use App\Http\Requests\Posts\StoreCommentRequest;
use App\Http\Requests\Posts\UpdateCommentRequest;
use App\Models\Post;
use App\Models\PostComment;
use App\Models\User;
use App\Notifications\DatabaseActivityNotification;
use App\Services\Notifications\MentionNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PostEngagementController extends Controller
{
    public function toggleLike(Post $post): RedirectResponse|JsonResponse
    {
        $this->authorize('view', $post);
        $actor = request()->user();

        $liked = DB::transaction(function () use ($post, $actor) {
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
            $post->loadMissing('user');

            if (! $post->user->is(request()->user())) {
                $post->user->notify(new DatabaseActivityNotification([
                    'type' => 'like',
                    'title' => "{$actor->name} liked your post",
                    'body' => str($post->body)->limit(100)->toString(),
                    'href' => route('users.show', [
                        'user' => $post->user->username,
                        'post' => $post->id,
                    ]),
                    'actor' => $this->actorPayload($actor),
                ]));
            }

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

    public function toggleRepost(Post $post): RedirectResponse|JsonResponse
    {
        $this->authorize('view', $post);
        $actor = request()->user();

        $reposted = DB::transaction(function () use ($post, $actor) {
            $repost = $post->reposts()->where('user_id', request()->user()->id)->first();

            if ($repost) {
                $repost->delete();
                $post->decrement('reposts_count');

                return false;
            }

            $post->reposts()->create([
                'user_id' => request()->user()->id,
            ]);
            $post->increment('reposts_count');
            $post->loadMissing('user');

            if (! $post->user->is(request()->user())) {
                $post->user->notify(new DatabaseActivityNotification([
                    'type' => 'repost',
                    'title' => "{$actor->name} reposted your post",
                    'body' => str($post->body)->limit(100)->toString(),
                    'href' => route('users.show', [
                        'user' => $actor->username,
                        'post' => $post->id,
                    ]),
                    'actor' => $this->actorPayload($actor),
                ]));
            }

            return true;
        });

        $post->refresh();

        if (request()->expectsJson()) {
            return response()->json([
                'reposted' => $reposted,
                'reposts_count' => $post->reposts_count,
            ]);
        }

        return back();
    }

    public function storeComment(StoreCommentRequest $request, Post $post): RedirectResponse
    {
        $this->authorize('view', $post);
        $mentionNotificationService = app(MentionNotificationService::class);

        DB::transaction(function () use ($request, $post, $mentionNotificationService) {
            $parentComment = null;

            if ($request->filled('parent_id')) {
                $parentComment = $post->comments()->with('user')->find($request->integer('parent_id'));
            }

            $comment = $post->comments()->create([
                'user_id' => $request->user()->id,
                'parent_id' => $parentComment?->id,
                'body' => $request->string('body')->toString(),
            ]);

            $post->increment('comments_count');

            $post->loadMissing('user');

            if (! $post->user->is($request->user())) {
                $post->user->notify(new DatabaseActivityNotification([
                    'type' => 'comment',
                    'title' => $parentComment
                        ? "{$request->user()->name} replied to a comment on your post"
                        : "{$request->user()->name} commented on your post",
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
                        'avatar_url' => User::mediaUrl($request->user()->avatar_path),
                        'avatar_position_x' => $request->user()->avatar_position_x ?? 50,
                        'avatar_position_y' => $request->user()->avatar_position_y ?? 50,
                        'avatar_zoom' => $request->user()->avatar_zoom ?? 1,
                    ],
                ]));
            }

            $mentionNotificationService->notifyCommentMentions(
                $request->user(),
                $post,
                $comment,
                $comment->body,
            );

            if ($parentComment && $parentComment->user && ! $parentComment->user->is($request->user()) && ! $parentComment->user->is($post->user)) {
                $parentComment->user->notify(new DatabaseActivityNotification([
                    'type' => 'comment',
                    'title' => "{$request->user()->name} replied to your comment",
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
                        'avatar_url' => User::mediaUrl($request->user()->avatar_path),
                        'avatar_position_x' => $request->user()->avatar_position_x ?? 50,
                        'avatar_position_y' => $request->user()->avatar_position_y ?? 50,
                        'avatar_zoom' => $request->user()->avatar_zoom ?? 1,
                    ],
                ]));
            }
        });

        return back();
    }

    public function toggleCommentLove(Post $post, PostComment $comment): RedirectResponse|JsonResponse
    {
        $this->authorize('view', $post);

        abort_unless($comment->post_id === $post->id, 404);

        $liked = DB::transaction(function () use ($comment) {
            $userId = request()->user()->id;
            $like = $comment->likes()->where('user_id', $userId)->first();

            if ($like) {
                $like->delete();
                $comment->decrement('likes_count');

                return false;
            }

            $comment->likes()->create([
                'user_id' => $userId,
            ]);
            $comment->increment('likes_count');

            return true;
        });

        $comment->refresh();

        if (request()->expectsJson()) {
            return response()->json([
                'liked' => $liked,
                'likes_count' => $comment->likes_count,
            ]);
        }

        return back();
    }

    public function updateComment(
        UpdateCommentRequest $request,
        Post $post,
        PostComment $comment,
    ): RedirectResponse|JsonResponse {
        $this->authorize('view', $post);
        abort_unless($comment->post_id === $post->id, 404);
        abort_unless($comment->user_id === $request->user()->id, 403);

        $comment->update([
            'body' => $request->string('body')->toString(),
        ]);

        if ($request->expectsJson()) {
            return response()->json([
                'comment' => [
                    'id' => $comment->id,
                    'body' => $comment->body,
                    'likes_count' => $comment->likes_count ?? 0,
                    'is_liked' => $comment->relationLoaded('likes')
                        ? $comment->likes->contains('user_id', $request->user()->id)
                        : $comment->likes()->where('user_id', $request->user()->id)->exists(),
                ],
            ]);
        }

        return back();
    }

    public function destroyComment(
        Request $request,
        Post $post,
        PostComment $comment,
    ): RedirectResponse|JsonResponse {
        $this->authorize('view', $post);
        abort_unless($comment->post_id === $post->id, 404);
        abort_unless($comment->user_id === $request->user()->id, 403);

        $deletedCount = $this->countCommentBranch($post->id, $comment->id);

        DB::transaction(function () use ($comment, $post, $deletedCount) {
            $comment->delete();
            $post->decrement('comments_count', $deletedCount);
        });

        if ($request->expectsJson()) {
            return response()->json([
                'comment_id' => $comment->id,
                'deleted_count' => $deletedCount,
            ]);
        }

        return back();
    }

    private function countCommentBranch(int $postId, int $commentId): int
    {
        $count = 0;
        $pending = [$commentId];

        while ($pending !== []) {
            $count += count($pending);

            $pending = PostComment::query()
                ->where('post_id', $postId)
                ->whereIn('parent_id', $pending)
                ->pluck('id')
                ->all();
        }

        return $count;
    }

    private function actorPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'avatar_url' => User::mediaUrl($user->avatar_path),
            'avatar_position_x' => $user->avatar_position_x ?? 50,
            'avatar_position_y' => $user->avatar_position_y ?? 50,
            'avatar_zoom' => $user->avatar_zoom ?? 1,
        ];
    }
}
