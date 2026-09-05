<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

class Invoice extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'invoice_number',
        'customer_id',
        'motor_id',
        'description',
        'amount',
        'issued_date',
        'notes',
    ];

    protected $casts = [
        'amount'      => 'decimal:2',
        'issued_date' => 'date',
    ];

    protected static function booted(): void
    {
        static::creating(function (Invoice $invoice) {
            if (empty($invoice->invoice_number)) {
                $invoice->invoice_number = static::generateNumber();
            }
        });
    }

    public static function generateNumber(): string
    {
        return DB::transaction(function () {
            $year  = now()->year;
            $count = static::withTrashed()
                ->whereYear('created_at', $year)
                ->lockForUpdate()
                ->count() + 1;

            return 'INV-' . $year . '-' . str_pad((string) $count, 4, '0', STR_PAD_LEFT);
        });
    }

    public function paidAmount(): float
    {
        return (float) $this->transactions()->sum('amount');
    }

    public function remainingAmount(): float
    {
        return (float) $this->amount - $this->paidAmount();
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function motor(): BelongsTo
    {
        return $this->belongsTo(Motor::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }
}
