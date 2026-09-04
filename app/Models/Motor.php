<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Category;
use App\Models\Employee;
use App\Models\Part;
use App\Models\User;

class Motor extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'reference_number',
        'customer_id',
        'category_id',
        'status',
        'notes',
        'received_at',
        'delivered_at',
        'assigned_to',
        'received_by',
    ];

    protected $casts = [
        'received_at'       => 'datetime',
        'delivered_at'      => 'datetime',
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
            $motor->receivedItems()->delete();
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

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function assignedToUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function receivedByEmployee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'received_by');
    }

    public function maintenanceOrders(): HasMany
    {
        return $this->hasMany(MaintenanceOrder::class);
    }

    public function receivedItems(): HasMany
    {
        return $this->hasMany(ReceivedItem::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    public function isLocked(): bool
    {
        if ($this->status !== 'delivered') {
            return false;
        }

        $this->loadMissing('customer');
        if ($this->customer?->account_type === 'account') {
            return true;
        }

        // Use aggregate queries to avoid loading entire relation trees
        $labor = $this->maintenanceOrders()->sum('labor_cost');
        $parts = Part::join('maintenance_orders', 'parts_used.maintenance_id', '=', 'maintenance_orders.id')
            ->where('maintenance_orders.motor_id', $this->id)
            ->sum('parts_used.total_cost');
        $paid = $this->transactions()->sum('amount');

        return ($labor + $parts - $paid) <= 0.009;
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

}
