<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->string('document_type')->nullable()->after('id_number');
            $table->string('emergency_contact_name')->nullable()->after('emergency_phone');
            $table->string('emergency_contact_relationship')->nullable()->after('emergency_contact_name');
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn(['document_type', 'emergency_contact_name', 'emergency_contact_relationship']);
        });
    }
};
