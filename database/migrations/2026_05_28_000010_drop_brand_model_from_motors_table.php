<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('motors', function (Blueprint $table) {
            $table->dropColumn(['brand', 'model']);
        });
    }

    public function down(): void
    {
        Schema::table('motors', function (Blueprint $table) {
            $table->string('brand')->nullable()->after('category_id');
            $table->string('model')->nullable()->after('brand');
        });
    }
};
