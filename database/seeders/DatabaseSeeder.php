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

        $frenchCreator = User::factory()->create([
            'onboarding_completed_at' => now(),
        ]);

        $arabicCreator = User::factory()->create([
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

        $seedPosts = [
            [$leader, 'Designing a calmer dashboard today #design_systems', ['design_systems']],
            [$leader, 'Release planning notes for the week #launch_notes', ['launch_notes']],
            [$leader, 'Syncing the team workflow #creator_workflow', ['creator_workflow']],
            [$users[1], 'A sharper component library is taking shape #design_systems', ['design_systems']],
            [$users[1], 'Small release, big polish #launch_notes', ['launch_notes']],
            [$users[2], 'Working through shipping rituals #creator_workflow', ['creator_workflow']],
            [$users[2], 'Building a cleaner onboarding path #design_systems', ['design_systems']],
            [$users[3], 'Launch notes from the product team #launch_notes', ['launch_notes']],
            [$users[3], 'Weekly retro and reflection #creator_workflow', ['creator_workflow']],
            [$users[4], 'Design systems keep the app consistent #design_systems', ['design_systems']],
            [$users[4], 'The next release is almost ready #launch_notes', ['launch_notes']],
            [$users[5], 'Collaboration notes for the sprint #creator_workflow', ['creator_workflow']],
            [$users[5], 'A few launch checklist updates #launch_notes', ['launch_notes']],
            [$users[6], 'Refining layout details today #design_systems', ['design_systems']],
            [$users[6], 'Tracking delivery milestones #launch_notes', ['launch_notes']],
            [$users[7], 'Shipping flow improvements #creator_workflow', ['creator_workflow']],
            [$frenchCreator, 'On construit une expérience plus calme et plus utile #design_systems', ['design_systems']],
            [$frenchCreator, 'Cette semaine, on peaufine les derniers détails avant la sortie #launch_notes', ['launch_notes']],
            [$arabicCreator, 'نصمم تجربة أبسط وأكثر وضوحًا للمستخدمين #creator_workflow', ['creator_workflow']],
            [$arabicCreator, 'الدفعة الجديدة جاهزة تقريبًا بعد مراجعة كل التفاصيل #launch_notes', ['launch_notes']],
        ];

        foreach ($seedPosts as [$user, $body, $hashtags]) {
            Post::factory()->for($user)->create([
                'body' => $body,
                'visibility' => 'public',
                'hashtags' => $hashtags,
            ]);
        }
    }
}
