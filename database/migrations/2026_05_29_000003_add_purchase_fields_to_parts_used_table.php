<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('parts_used', function (Blueprint $table) {
            $table->enum('purchased_by', ['customer', 'company'])->default('customer')->after('type');
            $table->decimal('unit_price', 10, 2)->default(0)->after('unit_cost');
        });
    }

    public function down(): void
    {
        Schema::table('parts_used', function (Blueprint $table) {
            $table->dropColumn(['purchased_by', 'unit_price']);
        });
    }
};
