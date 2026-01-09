<?php

namespace Database\Seeders;

use App\Enums\FollowStatus;
use App\Models\Follow;
use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $demo = User::factory()->create([
            'name' => 'Vynce Admin',
            'username' => 'vynce',
            'email' => 'test@example.com',
            'role' => 'admin',
            'onboarding_completed_at' => now(),
        ]);

        $users = User::factory(8)->create([
            'onboarding_completed_at' => now(),
        ]);

        $users->take(3)->each(function (User $user) use ($demo) {
            Follow::query()->create([
                'follower_id' => $demo->id,
                'followed_id' => $user->id,
                'status' => FollowStatus::Accepted,
                'accepted_at' => now(),
            ]);
        });

        Post::factory()->count(3)->for($demo)->create();
        $users->each(fn (User $user) => Post::factory()->count(2)->for($user)->create());
    }
}
