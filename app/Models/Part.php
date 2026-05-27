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
        'total_cost',
        'is_paid',
        'type',
        'invoice_image',
    ];

    protected $casts = [
        'quantity'   => 'decimal:3',
        'unit_cost'  => 'decimal:2',
        'total_cost' => 'decimal:2',
        'is_paid'    => 'boolean',
    ];

    protected static function booted(): void
    {
        static::saving(function (Part $part) {
            $part->total_cost = $part->quantity * $part->unit_cost;
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
