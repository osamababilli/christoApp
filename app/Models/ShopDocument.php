<?php
namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ShopDocument extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name', 'description', 'file_path', 'original_name',
        'mime_type', 'file_size', 'renewal_date',
        'reminder_days_before', 'reminder_sent_at',
    ];

    protected $casts = [
        'renewal_date'     => 'date',
        'reminder_sent_at' => 'datetime',
        'file_size'        => 'integer',
    ];

    public function getStatusAttribute(): string
    {
        if (! $this->renewal_date) return 'active';
        $today = Carbon::today();
        if ($this->renewal_date->lt($today)) return 'expired';
        if ($today->diffInDays($this->renewal_date) <= $this->reminder_days_before) return 'expiring';
        return 'active';
    }

    public function getDaysRemainingAttribute(): ?int
    {
        if (! $this->renewal_date) return null;
        $today = Carbon::today();
        if ($this->renewal_date->lt($today)) return -$today->diffInDays($this->renewal_date);
        return $today->diffInDays($this->renewal_date);
    }

    public function getFileSizeFormattedAttribute(): string
    {
        if (! $this->file_size) return '—';
        $kb = $this->file_size / 1024;
        if ($kb < 1024) return round($kb, 1) . ' KB';
        return round($kb / 1024, 2) . ' MB';
    }
}
