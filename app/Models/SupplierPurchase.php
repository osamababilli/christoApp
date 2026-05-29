<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class SupplierPurchase extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'supplier_id', 'part_name', 'part_type',
        'quantity', 'unit_cost', 'total_cost',
        'purchase_date', 'notes',
    ];

    protected $casts = [
        'quantity'      => 'decimal:3',
        'unit_cost'     => 'decimal:2',
        'total_cost'    => 'decimal:2',
        'purchase_date' => 'date',
    ];

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }
}
