<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class MaintenanceOrder extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'maintenance_orders';

    protected $fillable = [
        'motor_id',
        'stage',
        'description',
        'started_at',
        'completed_at',
        'labor_cost',
        'status',
        'stop_reason',
    ];

    protected $casts = [
        'started_at'   => 'datetime',
        'completed_at' => 'datetime',
        'labor_cost'   => 'decimal:2',
    ];

    public function motor(): BelongsTo
    {
        return $this->belongsTo(Motor::class);
    }

    public function parts(): HasMany
    {
        return $this->hasMany(Part::class, 'maintenance_id');
    }

    public static function statusLabel(string $status): string
    {
        return match($status) {
            'in_progress' => 'قيد التنفيذ',
            'completed'   => 'مكتمل',
            'on_hold'     => 'موقوف',
            default       => $status,
        };
    }
}
