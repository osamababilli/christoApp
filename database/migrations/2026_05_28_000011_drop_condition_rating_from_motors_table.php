<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('motors', function (Blueprint $table) {
            $table->dropColumn('condition_rating');
        });
    }

    public function down(): void
    {
        Schema::table('motors', function (Blueprint $table) {
            $table->enum('condition_rating', ['excellent', 'good', 'fair', 'poor'])->nullable()->after('status');
        });
    }
};
