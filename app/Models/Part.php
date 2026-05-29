<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Part extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'parts_used';

    protected $fillable = [
        'maintenance_id',
        'part_name',
        'supplier_id',
        'quantity',
        'unit_cost',
        'unit_price',
        'total_cost',
        'is_paid',
        'type',
        'purchased_by',
        'invoice_image',
    ];

    protected $casts = [
        'quantity'   => 'decimal:3',
        'unit_cost'  => 'decimal:2',
        'unit_price' => 'decimal:2',
        'total_cost' => 'decimal:2',
        'is_paid'    => 'boolean',
    ];

    protected static function booted(): void
    {
        static::saving(function (Part $part) {
            if ($part->purchased_by === 'customer') {
                // العميل يشتري القطعة بنفسه — لا تدخل في الحسبة المالية
                $part->unit_cost  = $part->unit_cost  ?? 0;
                $part->unit_price = 0;
                $part->total_cost = 0;
                $part->is_paid    = true;
            } elseif ($part->purchased_by === 'company' && $part->unit_price > 0) {
                $part->total_cost = $part->quantity * $part->unit_price;
            } else {
                $part->total_cost = $part->quantity * $part->unit_cost;
            }
        });
    }

    public function maintenance(): BelongsTo
    {
        return $this->belongsTo(MaintenanceOrder::class, 'maintenance_id');
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public static function typeLabel(string $type): string
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
