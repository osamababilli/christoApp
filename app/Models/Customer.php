<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name', 'phone', 'email', 'notes', 'account_type', 'opening_balance', 'opening_balance_notes',
        'client_type', 'address', 'responsible_name', 'responsible_phone', 'accounting_name', 'accounting_phone', 'accounting_email',
    ];

    protected $casts = ['opening_balance' => 'decimal:2'];

    public function motors(): HasMany
    {
        return $this->hasMany(Motor::class);
    }

    public function contacts(): HasMany
    {
        return $this->hasMany(CustomerContact::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    public function quotations(): HasMany
    {
        return $this->hasMany(Quotation::class);
    }

    /** Total invoiced + opening balance − all recorded payments/discounts (account-level balance). */
    public function outstandingBalance(): float
    {
        $totalInvoiced = (float) $this->invoices()->sum('amount');
        $totalPaid     = (float) $this->transactions()->sum('amount');

        return $totalInvoiced + (float) ($this->opening_balance ?? 0) - $totalPaid;
    }

    public static function clientTypeLabel(?string $type): string
    {
        return match ($type) {
            'military' => 'مؤسسة عسكرية',
            'garage'   => 'كراج',
            'company'  => 'شركة',
            default    => 'فردي',
        };
    }
}
