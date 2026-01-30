<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('post_media', function (Blueprint $table) {
            $table->decimal('zoom', 4, 2)->default(1)->after('size');
            $table->unsignedTinyInteger('position_x')->default(50)->after('zoom');
            $table->unsignedTinyInteger('position_y')->default(50)->after('position_x');
        });
    }

    public function down(): void
    {
        Schema::table('post_media', function (Blueprint $table) {
            $table->dropColumn(['zoom', 'position_x', 'position_y']);
        });
    }
};
