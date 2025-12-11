<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('follows', function (Blueprint $table) {
            $table->id();
            $table->foreignId('follower_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('followed_id')->constrained('users')->cascadeOnDelete();
            $table->string('status');
            $table->timestamp('accepted_at')->nullable();
            $table->timestamps();

            $table->unique(['follower_id', 'followed_id']);
            $table->index(['followed_id', 'status']);
            $table->index(['follower_id', 'status']);
        });

        Schema::create('user_blocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('blocker_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('blocked_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['blocker_id', 'blocked_id']);
        });

        Schema::create('user_mutes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('muter_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('muted_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->unique(['muter_id', 'muted_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_mutes');
        Schema::dropIfExists('user_blocks');
        Schema::dropIfExists('follows');
    }
};
