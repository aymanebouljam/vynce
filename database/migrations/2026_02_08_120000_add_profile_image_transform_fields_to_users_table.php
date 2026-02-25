<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->decimal('avatar_zoom', 4, 2)->default(1)->after('avatar_path');
            $table->unsignedTinyInteger('avatar_position_x')->default(50)->after('avatar_zoom');
            $table->unsignedTinyInteger('avatar_position_y')->default(50)->after('avatar_position_x');
            $table->decimal('cover_zoom', 4, 2)->default(1)->after('cover_path');
            $table->unsignedTinyInteger('cover_position_x')->default(50)->after('cover_zoom');
            $table->unsignedTinyInteger('cover_position_y')->default(50)->after('cover_position_x');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'avatar_zoom',
                'avatar_position_x',
                'avatar_position_y',
                'cover_zoom',
                'cover_position_x',
                'cover_position_y',
            ]);
        });
    }
};
