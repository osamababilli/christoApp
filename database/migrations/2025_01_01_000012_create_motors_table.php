<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('motors', function (Blueprint $table) {
            $table->id();
            $table->string('reference_number')->unique();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->string('brand')->nullable();
            $table->string('model')->nullable();
            $table->enum('status', ['in_workshop', 'in_progress', 'ready', 'delivered'])->default('in_workshop');
            $table->enum('condition_rating', ['excellent', 'good', 'fair', 'poor'])->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('received_at')->useCurrent();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('motors');
    }
};
