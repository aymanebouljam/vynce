<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
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

    public function test_user_can_update_profile_avatar(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/profile/avatar', [
            'avatar' => UploadedFile::fake()->image('avatar.jpg'),
        ]);

        $response->assertSessionHasNoErrors()
            ->assertRedirect(route('users.show', $user->username, absolute: false));

        $user->refresh();

        $this->assertNotNull($user->avatar_path);
        Storage::disk('public')->assertExists($user->avatar_path);
    }

    public function test_user_can_update_profile_cover(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/profile/cover', [
            'cover' => UploadedFile::fake()->image('cover.jpg')->size(1000),
        ]);

        $response->assertSessionHasNoErrors()
            ->assertRedirect(route('users.show', $user->username, absolute: false));

        $user->refresh();

        $this->assertNotNull($user->cover_path);
        Storage::disk('public')->assertExists($user->cover_path);
    }

    public function test_user_can_adjust_profile_image_framing(): void
    {
        $user = User::factory()->create([
            'avatar_zoom' => 1,
            'avatar_position_x' => 50,
            'avatar_position_y' => 50,
            'cover_zoom' => 1,
            'cover_position_x' => 50,
            'cover_position_y' => 50,
        ]);

        $this->actingAs($user)->patch('/profile/avatar/transform', [
            'zoom' => 1.8,
            'position_x' => 63,
            'position_y' => 41,
        ])->assertSessionHasNoErrors();

        $this->actingAs($user)->patch('/profile/cover/transform', [
            'zoom' => 2.2,
            'position_x' => 57,
            'position_y' => 36,
        ])->assertSessionHasNoErrors();

        $user->refresh();

        $this->assertSame(1.8, $user->avatar_zoom);
        $this->assertSame(63, $user->avatar_position_x);
        $this->assertSame(41, $user->avatar_position_y);
        $this->assertSame(2.2, $user->cover_zoom);
        $this->assertSame(57, $user->cover_position_x);
        $this->assertSame(36, $user->cover_position_y);
    }

    public function test_user_can_delete_profile_images(): void
    {
        Storage::fake('public');

        $avatarPath = UploadedFile::fake()->image('avatar.jpg')->store('avatars', 'public');
        $coverPath = UploadedFile::fake()->image('cover.jpg')->store('covers', 'public');

        $user = User::factory()->create([
            'avatar_path' => $avatarPath,
            'cover_path' => $coverPath,
            'avatar_zoom' => 1.5,
            'cover_zoom' => 1.8,
        ]);

        $this->actingAs($user)->delete('/profile/avatar')
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('users.show', $user->username, absolute: false));

        $this->actingAs($user)->delete('/profile/cover')
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('users.show', $user->username, absolute: false));

        $user->refresh();

        $this->assertNull($user->avatar_path);
        $this->assertNull($user->cover_path);
        $this->assertSame(1.0, $user->avatar_zoom);
        $this->assertSame(1.0, $user->cover_zoom);

        Storage::disk('public')->assertMissing($avatarPath);
        Storage::disk('public')->assertMissing($coverPath);
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
