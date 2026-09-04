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
        Schema::table('supplier_purchases', function (Blueprint $table) {
            $table->dropForeign(['supplier_id']);
        });

        Schema::table('supplier_purchases', function (Blueprint $table) {
            $table->unsignedBigInteger('supplier_id')->nullable()->change();
        });

        Schema::table('supplier_purchases', function (Blueprint $table) {
            $table->foreign('supplier_id')->references('id')->on('suppliers')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('supplier_purchases', function (Blueprint $table) {
            $table->dropForeign(['supplier_id']);
        });

        Schema::table('supplier_purchases', function (Blueprint $table) {
            $table->unsignedBigInteger('supplier_id')->nullable(false)->change();
        });

        Schema::table('supplier_purchases', function (Blueprint $table) {
            $table->foreign('supplier_id')->references('id')->on('suppliers')->cascadeOnDelete();
        });
    }
};
