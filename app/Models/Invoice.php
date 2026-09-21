<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

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

    /**
     * رقم فريد غير متسلسل — يعتمد على الوقت ورموز عشوائية بدل عدّ الصفوف،
     * لتفادي التعارض (race condition) بين طلبين متزامنين. الفرادة مضمونة
     * إضافياً عبر قيد unique على العمود بقاعدة البيانات.
     */
    public static function generateNumber(): string
    {
        return 'INV-' . now()->format('Ymd') . '-' . Str::upper(Str::random(6));
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
