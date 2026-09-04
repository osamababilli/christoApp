<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ReceivedItem extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'motor_id',
        'item_name',
        'quantity',
    ];

    public function motor(): BelongsTo
    {
        return $this->belongsTo(Motor::class);
    }
}
