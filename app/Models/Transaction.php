<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Transaction extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'motor_id',
        'invoice_id',
        'customer_id',
        'type',
        'payment_method',
        'account_name',
        'reference_no',
        'amount',
        'paid_amount',
        'remaining_amount',
        'transaction_date',
        'notes',
    ];

    protected $casts = [
        'amount'           => 'decimal:2',
        'paid_amount'      => 'decimal:2',
        'remaining_amount' => 'decimal:2',
        'transaction_date' => 'datetime',
    ];

    public function motor(): BelongsTo
    {
        return $this->belongsTo(Motor::class);
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function accountEntry(): HasOne
    {
        return $this->hasOne(AccountEntry::class);
    }

    public static function paymentMethodLabel(?string $method): ?string
    {
        return match($method) {
            'cash'  => 'نقدًا',
            'whish' => 'Whish',
            'omt'   => 'OMT',
            'check' => 'شيك',
            default => null,
        };
    }
}
