<?php

use App\Support\Permissions;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Legacy rows carry roles like "user" that no permission maps to — fold them into the lowest role
        DB::table('users')->whereNotIn('role', Permissions::ROLES)->update(['role' => 'cashier']);

        // Never leave the system without someone who can manage users
        if (! DB::table('users')->where('role', 'admin')->exists()) {
            DB::table('users')->orderBy('id')->limit(1)->update(['role' => 'admin', 'status' => 'active']);
        }
    }

    public function down(): void
    {
        //
    }
};
