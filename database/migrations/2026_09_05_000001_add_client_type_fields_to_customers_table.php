<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->enum('client_type', ['individual', 'military', 'garage', 'company'])
                ->default('individual')
                ->after('name');
            $table->string('address')->nullable()->after('email');
            $table->string('responsible_name')->nullable()->after('address'); // موّسسة عسكرية: المسؤول عنه
            $table->string('accounting_name')->nullable()->after('responsible_name');
            $table->string('accounting_phone')->nullable()->after('accounting_name');
            $table->string('accounting_email')->nullable()->after('accounting_phone');
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn([
                'client_type',
                'address',
                'responsible_name',
                'accounting_name',
                'accounting_phone',
                'accounting_email',
            ]);
        });
    }
};
