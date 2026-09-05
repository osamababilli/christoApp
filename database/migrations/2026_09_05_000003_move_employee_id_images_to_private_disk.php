<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

return new class extends Migration
{
    public function up(): void
    {
        $this->move('public', 'local');
    }

    public function down(): void
    {
        $this->move('local', 'public');
    }

    private function move(string $from, string $to): void
    {
        foreach (DB::table('employees')->whereNotNull('id_image')->pluck('id_image') as $path) {
            if (Storage::disk($from)->exists($path) && ! Storage::disk($to)->exists($path)) {
                Storage::disk($to)->put($path, Storage::disk($from)->get($path));
                Storage::disk($from)->delete($path);
            }
        }
    }
};
