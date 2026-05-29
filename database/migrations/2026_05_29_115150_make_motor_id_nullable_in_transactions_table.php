<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropForeign(['motor_id']);
            $table->unsignedBigInteger('motor_id')->nullable()->change();
            $table->foreign('motor_id')->references('id')->on('motors')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropForeign(['motor_id']);
            $table->unsignedBigInteger('motor_id')->nullable(false)->change();
            $table->foreign('motor_id')->references('id')->on('motors')->onDelete('cascade');
        });
    }
};
