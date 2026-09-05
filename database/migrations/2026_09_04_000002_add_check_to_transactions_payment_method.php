<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            // SQLite has no native ENUM — the column is a plain TEXT/VARCHAR, nothing to alter.
            return;
        }

        DB::statement("ALTER TABLE transactions MODIFY payment_method ENUM('cash', 'whish', 'omt', 'check') NULL");
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            return;
        }

        DB::statement("ALTER TABLE transactions MODIFY payment_method ENUM('cash', 'whish', 'omt') NULL");
    }
};
