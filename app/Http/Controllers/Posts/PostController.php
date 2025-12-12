<?php

namespace App\Http\Controllers\Posts;

use App\Actions\Posts\CreatePostAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Posts\StorePostRequest;
use App\Http\Requests\Posts\UpdatePostRequest;
use App\Models\Post;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

class PostController extends Controller
{
    public function store(
        StorePostRequest $request,
        CreatePostAction $createPostAction,
    ): RedirectResponse {
        $this->authorize('create', Post::class);

        $createPostAction->execute($request->user(), $request->validated());

        return back()->with('success', 'Post published.');
    }

    public function update(UpdatePostRequest $request, Post $post): RedirectResponse
    {
        $this->authorize('update', $post);

        $post->update([
            'body' => $request->string('body')->value(),
            'visibility' => $request->string('visibility')->value(),
        ]);

        return back()->with('success', 'Post updated.');
    }

    public function destroy(Post $post): RedirectResponse
    {
        $this->authorize('delete', $post);

        DB::transaction(function () use ($post) {
            $post->media()->delete();
            $post->delete();
        });

        return back()->with('success', 'Post deleted.');
    }
}
