<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuotationItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'quotation_id',
        'type',
        'description',
        'part_type',
        'quantity',
        'unit_price',
        'total_price',
        'sort_order',
    ];

    protected $casts = [
        'quantity'    => 'decimal:3',
        'unit_price'  => 'decimal:2',
        'total_price' => 'decimal:2',
    ];

    protected static function booted(): void
    {
        static::saving(function (QuotationItem $item) {
            $item->total_price = $item->quantity * $item->unit_price;
        });
    }

    public function quotation(): BelongsTo
    {
        return $this->belongsTo(Quotation::class);
    }

    public static function partTypeLabel(string $type): string
    {
        return match($type) {
            'part'      => 'قطعة',
            'oil'       => 'زيت',
            'transport' => 'نقل',
            'cleaning'  => 'تنظيف',
            'other'     => 'أخرى',
            default     => $type,
        };
    }
}
