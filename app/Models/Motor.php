<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Motor extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'reference_number',
        'customer_id',
        'brand',
        'model',
        'status',
        'condition_rating',
        'notes',
        'received_at',
        'delivered_at',
    ];

    protected $casts = [
        'received_at' => 'datetime',
        'delivered_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (Motor $motor) {
            if (empty($motor->reference_number)) {
                $motor->reference_number = static::generateReference();
            }
        });

        static::deleting(function (Motor $motor) {
            $motor->maintenanceOrders()->each(fn($o) => $o->delete());
        });
    }

    public static function generateReference(): string
    {
        $year = now()->year;
        $count = static::withTrashed()->whereYear('created_at', $year)->count() + 1;
        return 'MTR-' . $year . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function maintenanceOrders(): HasMany
    {
        return $this->hasMany(MaintenanceOrder::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    public static function statusLabel(string $status): string
    {
        return match($status) {
            'in_workshop' => 'في الورشة',
            'in_progress' => 'قيد الإصلاح',
            'ready'       => 'جاهز للاستلام',
            'delivered'   => 'تم التسليم',
            default       => $status,
        };
    }

    public static function conditionLabel(string $rating): string
    {
        return match($rating) {
            'excellent' => 'ممتاز',
            'good'      => 'جيد',
            'fair'      => 'مقبول',
            'poor'      => 'ضعيف',
            default     => $rating,
        };
    }
}
