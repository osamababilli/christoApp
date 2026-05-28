<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('motors', function (Blueprint $table) {
            $table->foreignId('category_id')->nullable()->constrained('categories')->nullOnDelete()->after('customer_id');
            $table->unsignedBigInteger('stories_posted_by')->nullable()->after('notes');
            $table->timestamp('stories_posted_at')->nullable()->after('stories_posted_by');
            $table->unsignedBigInteger('assigned_to')->nullable()->after('stories_posted_at');

            $table->foreign('stories_posted_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('assigned_to')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('motors', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
            $table->dropForeign(['stories_posted_by']);
            $table->dropForeign(['assigned_to']);
            $table->dropColumn(['category_id', 'stories_posted_by', 'stories_posted_at', 'assigned_to']);
        });
    }
};
