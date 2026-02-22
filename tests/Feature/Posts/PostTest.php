<?php

namespace Tests\Feature\Posts;

use App\Http\Resources\PostResource;
use App\Models\Post;
use App\Models\PostComment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PostTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_users_can_create_posts_with_media_and_parsed_tags(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/posts', [
            'body' => 'Hello #Laravel from @vynce',
            'visibility' => 'public',
            'media' => [UploadedFile::fake()->image('post.png')],
        ]);

        $response->assertRedirect();

        $post = Post::query()->first();

        $this->assertSame(['laravel'], $post->hashtags);
        $this->assertSame(['vynce'], $post->mentions);
        $this->assertCount(1, $post->media);
    }

    public function test_authenticated_users_can_create_image_only_posts(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/posts', [
            'body' => '',
            'visibility' => 'public',
            'media' => [UploadedFile::fake()->image('photo.png')],
        ]);

        $response->assertRedirect();

        $post = Post::query()->first();

        $this->assertSame('', $post->body);
        $this->assertCount(1, $post->media);
    }

    public function test_users_cannot_delete_other_users_posts(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $post = Post::factory()->for($owner)->create();

        $this->actingAs($other)
            ->delete(route('posts.destroy', $post))
            ->assertForbidden();
    }

    public function test_users_can_update_their_own_posts_and_adjust_visibility(): void
    {
        $user = User::factory()->create();
        $post = Post::factory()->for($user)->create([
            'body' => 'Original thought',
            'visibility' => 'public',
            'hashtags' => [],
            'mentions' => [],
        ]);

        $this->actingAs($user)
            ->patch(route('posts.update', $post), [
                'body' => 'Updated #Vynce note for @julia',
                'visibility' => 'followers',
            ])
            ->assertRedirect();

        $post->refresh();

        $this->assertSame('Updated #Vynce note for @julia', $post->body);
        $this->assertSame('followers', $post->visibility->value);
        $this->assertSame(['vynce'], $post->hashtags);
        $this->assertSame(['julia'], $post->mentions);
    }

    public function test_users_can_toggle_post_visibility_over_json_and_persist_it(): void
    {
        $user = User::factory()->create();
        $post = Post::factory()->for($user)->create([
            'body' => 'Original thought',
            'visibility' => 'public',
            'hashtags' => [],
            'mentions' => [],
        ]);

        $response = $this->actingAs($user)
            ->patchJson(route('posts.update', $post), [
                'body' => 'Original thought',
                'visibility' => 'followers',
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('post.id', $post->id)
            ->assertJsonPath('post.visibility', 'followers');

        $post->refresh();

        $this->assertSame('followers', $post->visibility->value);
    }

    public function test_users_can_delete_their_own_posts(): void
    {
        $user = User::factory()->create();
        $post = Post::factory()->for($user)->create();

        $this->actingAs($user)
            ->delete(route('posts.destroy', $post))
            ->assertRedirect();

        $this->assertSoftDeleted('posts', ['id' => $post->id]);
    }

    public function test_users_can_like_repost_and_comment_on_visible_posts(): void
    {
        $author = User::factory()->create();
        $viewer = User::factory()->create();
        $post = Post::factory()->for($author)->create([
            'visibility' => 'public',
            'likes_count' => 0,
            'reposts_count' => 0,
            'comments_count' => 0,
        ]);

        $this->actingAs($viewer)
            ->post(route('posts.likes.toggle', $post))
            ->assertRedirect();

        $this->actingAs($viewer)
            ->post(route('posts.reposts.toggle', $post))
            ->assertRedirect();

        $this->actingAs($viewer)
            ->post(route('posts.comments.store', $post), [
                'body' => 'This is a strong take.',
            ])
            ->assertRedirect();

        $post->refresh();

        $this->assertSame(1, $post->likes_count);
        $this->assertSame(1, $post->reposts_count);
        $this->assertSame(1, $post->comments_count);
        $this->assertCount(1, $post->likes);
        $this->assertCount(1, $post->reposts);
        $this->assertCount(1, $post->comments);
    }

    public function test_users_can_toggle_reposts_over_json_and_persist_it(): void
    {
        $author = User::factory()->create();
        $viewer = User::factory()->create();
        $post = Post::factory()->for($author)->create([
            'visibility' => 'public',
            'reposts_count' => 0,
        ]);

        $response = $this->actingAs($viewer)->postJson(route('posts.reposts.toggle', $post));

        $response
            ->assertOk()
            ->assertJsonPath('reposted', true)
            ->assertJsonPath('reposts_count', 1);

        $post->refresh();

        $this->assertSame(1, $post->reposts_count);
        $this->assertCount(1, $post->reposts);
    }

    public function test_users_can_reply_to_comments_and_get_nested_threads(): void
    {
        $author = User::factory()->create();
        $commenter = User::factory()->create();
        $replier = User::factory()->create();
        $post = Post::factory()->for($author)->create([
            'visibility' => 'public',
            'comments_count' => 0,
        ]);

        $this->actingAs($commenter)
            ->post(route('posts.comments.store', $post), [
                'body' => 'Parent comment.',
            ])
            ->assertRedirect();

        $parentComment = PostComment::query()->first();

        $this->actingAs($replier)
            ->post(route('posts.comments.store', $post), [
                'body' => 'Nested reply.',
                'parent_id' => $parentComment->id,
            ])
            ->assertRedirect();

        $post->refresh();

        $this->assertSame(2, $post->comments_count);
        $this->assertDatabaseHas('post_comments', [
            'post_id' => $post->id,
            'parent_id' => $parentComment->id,
            'body' => 'Nested reply.',
        ]);

        $request = Request::create('/');
        $request->setUserResolver(fn () => $replier);

        $serialized = PostResource::make($post->fresh(['user', 'comments.user', 'likes', 'reposts']))->resolve($request);

        $this->assertCount(1, $serialized['comments']);
        $this->assertSame($parentComment->id, $serialized['comments'][0]['id']);
        $this->assertCount(1, $serialized['comments'][0]['replies']);
        $this->assertSame('Nested reply.', $serialized['comments'][0]['replies'][0]['body']);
    }

    public function test_users_can_love_edit_and_delete_comments(): void
    {
        $author = User::factory()->create();
        $commentOwner = User::factory()->create();
        $viewer = User::factory()->create();
        $post = Post::factory()->for($author)->create([
            'visibility' => 'public',
            'comments_count' => 0,
        ]);

        $this->actingAs($commentOwner)
            ->post(route('posts.comments.store', $post), [
                'body' => 'Comment to manage.',
            ])
            ->assertRedirect();

        $comment = PostComment::query()->first();

        $this->actingAs($viewer)
            ->postJson(route('posts.comments.likes.toggle', [$post, $comment]))
            ->assertOk()
            ->assertJsonPath('liked', true)
            ->assertJsonPath('likes_count', 1);

        $this->actingAs($commentOwner)
            ->patchJson(route('posts.comments.update', [$post, $comment]), [
                'body' => 'Updated comment body.',
            ])
            ->assertOk()
            ->assertJsonPath('comment.body', 'Updated comment body.');

        $this->actingAs($commentOwner)
            ->deleteJson(route('posts.comments.destroy', [$post, $comment]))
            ->assertOk()
            ->assertJsonPath('deleted_count', 1);

        $post->refresh();

        $this->assertSame(0, $post->comments_count);
        $this->assertDatabaseMissing('post_comments', [
            'id' => $comment->id,
        ]);
    }
}
