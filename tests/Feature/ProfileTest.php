<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_page_is_displayed(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/profile');

        $response->assertOk();
    }

    public function test_profile_information_can_be_updated(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->patch('/profile', [
            'name' => 'Updated User',
            'username' => 'updated-user',
            'email' => 'updated@example.com',
            'bio' => 'A sharper profile bio.',
            'website_url' => 'https://vynce.test',
            'location' => 'Casablanca',
            'is_private' => true,
        ]);

        $response->assertSessionHasNoErrors()->assertRedirect('/profile');

        $user->refresh();

        $this->assertSame('Updated User', $user->name);
        $this->assertSame('updated-user', $user->username);
        $this->assertSame('updated@example.com', $user->email);
        $this->assertSame('A sharper profile bio.', $user->bio);
        $this->assertTrue($user->is_private);
        $this->assertNull($user->email_verified_at);
    }

    public function test_user_can_complete_onboarding(): void
    {
        $user = User::factory()->create(['onboarding_completed_at' => null]);

        $response = $this->actingAs($user)->post('/onboarding', [
            'name' => 'Onboarded User',
            'username' => 'onboarded-user',
            'bio' => 'Ready to post.',
            'website_url' => 'https://vynce.test',
            'location' => 'Remote',
            'is_private' => false,
        ]);

        $response->assertRedirect(route('feed.home', absolute: false));

        $this->assertNotNull($user->fresh()->onboarding_completed_at);
    }

    public function test_user_can_delete_their_account(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->delete('/profile', [
            'password' => 'password',
        ]);

        $response->assertSessionHasNoErrors()->assertRedirect('/');
        $this->assertGuest();
        $this->assertNull($user->fresh());
    }
}
