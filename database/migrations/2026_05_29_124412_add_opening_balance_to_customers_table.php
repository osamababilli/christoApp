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
        Schema::table('customers', function (Blueprint $table) {
            // Positive = customer owes from before; negative = customer has pre-existing credit
            $table->decimal('opening_balance', 12, 2)->default(0)->after('account_type');
            $table->text('opening_balance_notes')->nullable()->after('opening_balance');
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['opening_balance', 'opening_balance_notes']);
        });
    }
};
