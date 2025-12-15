<?php

namespace Tests\Feature\Posts;

use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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

    public function test_users_cannot_delete_other_users_posts(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $post = Post::factory()->for($owner)->create();

        $this->actingAs($other)
            ->delete(route('posts.destroy', $post))
            ->assertForbidden();
    }
}
