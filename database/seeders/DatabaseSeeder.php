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
        $users = User::factory(8)->create([
            'onboarding_completed_at' => now(),
        ]);

        $leader = $users->first();

        $users->slice(1, 3)->each(function (User $user) use ($leader) {
            Follow::query()->create([
                'follower_id' => $leader->id,
                'followed_id' => $user->id,
                'status' => FollowStatus::Accepted,
                'accepted_at' => now(),
            ]);
        });

        Post::factory()->count(3)->for($leader)->create();
        $users->each(fn (User $user) => Post::factory()->count(2)->for($user)->create());
    }
}
