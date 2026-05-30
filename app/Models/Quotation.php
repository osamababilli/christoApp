<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

class Quotation extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'reference_number',
        'customer_id',
        'customer_name',
        'customer_phone',
        'status',
        'notes',
        'valid_days',
        'converted_to_motor_id',
    ];

    protected static function booted(): void
    {
        static::creating(function (Quotation $quotation) {
            if (empty($quotation->reference_number)) {
                $quotation->reference_number = static::generateReference();
            }
        });
    }

    public static function generateReference(): string
    {
        return DB::transaction(function () {
            $year  = now()->year;
            $count = static::withTrashed()
                ->whereYear('created_at', $year)
                ->lockForUpdate()
                ->count() + 1;
            return 'QUO-' . $year . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);
        });
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function convertedToMotor(): BelongsTo
    {
        return $this->belongsTo(Motor::class, 'converted_to_motor_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(QuotationItem::class)->orderBy('sort_order');
    }

    public static function statusLabel(string $status): string
    {
        return match($status) {
            'draft'     => 'مسودة',
            'sent'      => 'تم الإرسال',
            'accepted'  => 'مقبول',
            'rejected'  => 'مرفوض',
            'converted' => 'تم التحويل',
            default     => $status,
        };
    }
}
