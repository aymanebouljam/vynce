<?php

use App\Enums\UserRole;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username')->nullable()->after('name');
            $table->text('bio')->nullable()->after('password');
            $table->string('avatar_path')->nullable()->after('bio');
            $table->string('cover_path')->nullable()->after('avatar_path');
            $table->string('website_url')->nullable()->after('cover_path');
            $table->string('location')->nullable()->after('website_url');
            $table->boolean('is_private')->default(false)->after('location');
            $table->string('role')->default(UserRole::User->value)->after('is_private');
            $table->timestamp('onboarding_completed_at')->nullable()->after('role');
            $table->timestamp('suspended_at')->nullable()->after('onboarding_completed_at');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->unique('username');
            $table->index('role');
            $table->index('is_private');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['role']);
            $table->dropIndex(['is_private']);
            $table->dropUnique(['username']);

            $table->dropColumn([
                'username',
                'bio',
                'avatar_path',
                'cover_path',
                'website_url',
                'location',
                'is_private',
                'role',
                'onboarding_completed_at',
                'suspended_at',
            ]);
        });
    }
};
