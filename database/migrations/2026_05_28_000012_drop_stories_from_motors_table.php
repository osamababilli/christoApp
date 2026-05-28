<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('motors', function (Blueprint $table) {
            $table->dropForeign(['stories_posted_by']);
            $table->dropColumn(['stories_posted_by', 'stories_posted_at']);
        });
    }

    public function down(): void
    {
        Schema::table('motors', function (Blueprint $table) {
            $table->unsignedBigInteger('stories_posted_by')->nullable()->after('notes');
            $table->timestamp('stories_posted_at')->nullable()->after('stories_posted_by');
            $table->foreign('stories_posted_by')->references('id')->on('users')->nullOnDelete();
        });
    }
};
