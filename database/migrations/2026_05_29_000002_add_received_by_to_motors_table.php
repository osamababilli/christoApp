<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('motors', function (Blueprint $table) {
            $table->foreignId('received_by')->nullable()->after('assigned_to')
                  ->constrained('employees')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('motors', function (Blueprint $table) {
            $table->dropForeignIdFor(\App\Models\Employee::class, 'received_by');
            $table->dropColumn('received_by');
        });
    }
};
