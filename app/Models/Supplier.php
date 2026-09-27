<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Supplier extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['name', 'address', 'phone', 'shop_phone', 'email', 'specialty', 'notes'];

    public function parts(): HasMany
    {
        return $this->hasMany(Part::class);
    }

    public function purchases(): HasMany
    {
        return $this->hasMany(SupplierPurchase::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(SupplierPayment::class);
    }

    public function outstandingBalance(): float
    {
        $motorPartsCost = (float) $this->parts()->sum('total_cost');
        $directCost     = (float) $this->purchases()->sum('total_cost');
        $totalPaid      = (float) $this->payments()->sum('amount');

        return $motorPartsCost + $directCost - $totalPaid;
    }
}
