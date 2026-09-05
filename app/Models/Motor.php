<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;
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

        // Archiving takes the whole job out of every figure: work, parts, payments and their treasury entries
        static::deleting(function (Motor $motor) {
            if ($motor->isForceDeleting()) {
                $orderIds = $motor->maintenanceOrders()->withTrashed()->pluck('id');
                $txIds    = $motor->transactions()->withTrashed()->pluck('id');

                AccountEntry::withTrashed()->whereIn('transaction_id', $txIds)->forceDelete();
                Transaction::withTrashed()->whereIn('id', $txIds)->forceDelete();
                Part::withTrashed()->whereIn('maintenance_id', $orderIds)->forceDelete();
                $motor->maintenanceOrders()->withTrashed()->forceDelete();
                $motor->receivedItems()->withTrashed()->forceDelete();

                return;
            }

            $orderIds = $motor->maintenanceOrders()->pluck('id');
            $txIds    = $motor->transactions()->pluck('id');

            AccountEntry::whereIn('transaction_id', $txIds)->delete();
            $motor->transactions()->delete();
            Part::whereIn('maintenance_id', $orderIds)->delete();
            $motor->maintenanceOrders()->delete();
            $motor->receivedItems()->delete();
        });

        // Bring everything back with the motor, otherwise it restores as an empty, unpaid job
        static::restoring(function (Motor $motor) {
            $orderIds = $motor->maintenanceOrders()->withTrashed()->pluck('id');
            $txIds    = $motor->transactions()->withTrashed()->pluck('id');

            Part::onlyTrashed()->whereIn('maintenance_id', $orderIds)->restore();
            $motor->maintenanceOrders()->onlyTrashed()->restore();
            $motor->receivedItems()->onlyTrashed()->restore();
            $motor->transactions()->onlyTrashed()->restore();
            AccountEntry::onlyTrashed()->whereIn('transaction_id', $txIds)->restore();
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

            return 'MTR-' . $year . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);
        });
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

    /** Labor + parts for every stage, via aggregate queries (no relation trees loaded). */
    public function grandTotal(): float
    {
        $labor = (float) $this->maintenanceOrders()->sum('labor_cost');
        $parts = (float) Part::join('maintenance_orders', 'parts_used.maintenance_id', '=', 'maintenance_orders.id')
            ->where('maintenance_orders.motor_id', $this->id)
            ->whereNull('maintenance_orders.deleted_at')
            ->sum('parts_used.total_cost');

        return $labor + $parts;
    }

    public function outstandingBalance(): float
    {
        return $this->grandTotal() - (float) $this->transactions()->sum('amount');
    }

    public function markPartsPaid(): void
    {
        Part::whereIn('maintenance_id', $this->maintenanceOrders()->pluck('id'))
            ->where('is_paid', false)
            ->update(['is_paid' => true]);
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

        return $this->outstandingBalance() <= 0.009;
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
