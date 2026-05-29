<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class AccountEntry extends Model
{
    use SoftDeletes;

    protected $table = 'accounting_entries';

    protected $fillable = ['type', 'amount', 'description', 'entry_date', 'notes'];

    protected $casts = [
        'amount'     => 'decimal:2',
        'entry_date' => 'date',
    ];

    public static function typeLabel(string $type): string
    {
        return match($type) {
            'income'  => 'دخل',
            'expense' => 'مصروف',
            'deposit' => 'إيداع',
            default   => $type,
        };
    }
}
