<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /** Motors archived before archiving cascaded to payments still count in every total — hide theirs too. */
    public function up(): void
    {
        $trashedMotorIds = DB::table('motors')->whereNotNull('deleted_at')->pluck('id');
        if ($trashedMotorIds->isEmpty()) {
            return;
        }

        $txIds = DB::table('transactions')
            ->whereIn('motor_id', $trashedMotorIds)
            ->whereNull('deleted_at')
            ->pluck('id');

        $now = now();
        DB::table('accounting_entries')->whereIn('transaction_id', $txIds)->whereNull('deleted_at')->update(['deleted_at' => $now]);
        DB::table('transactions')->whereIn('id', $txIds)->update(['deleted_at' => $now]);
    }

    public function down(): void
    {
        //
    }
};
