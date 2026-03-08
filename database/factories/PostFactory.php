<?php

namespace Database\Factories;

use App\Enums\PostVisibility;
use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class PostFactory extends Factory
{
    private const SEED_HASHTAGS = [
        'sport',
        'art',
        'pets',
    ];

    protected $model = Post::class;

    public function definition(): array
    {
        $body = fake()->paragraph();

        return [
            'user_id' => User::factory(),
            'body' => $body,
            'visibility' => fake()->randomElement(PostVisibility::cases()),
            'hashtags' => [fake()->randomElement(self::SEED_HASHTAGS)],
            'mentions' => [],
            'published_at' => now(),
        ];
    }
}
