<?php

namespace Database\Factories;

use App\Enums\PostVisibility;
use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Post>
 */
class PostFactory extends Factory
{
    protected $model = Post::class;

    public function definition(): array
    {
        $body = fake()->paragraph();

        return [
            'user_id' => User::factory(),
            'body' => $body,
            'visibility' => fake()->randomElement(PostVisibility::cases()),
            'hashtags' => ['vynce'],
            'mentions' => [],
            'published_at' => now(),
        ];
    }
}
