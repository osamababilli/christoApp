<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('suppliers', function (Blueprint $table) {
            $table->string('address')->nullable()->after('name');
            $table->string('shop_phone')->nullable()->after('phone');
            $table->string('specialty')->nullable()->after('email');
        });
    }

    public function down(): void
    {
        Schema::table('suppliers', function (Blueprint $table) {
            $table->dropColumn(['address', 'shop_phone', 'specialty']);
        });
    }
};
