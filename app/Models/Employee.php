<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    protected $fillable = [
        'full_name',
        'id_number',
        'nationality',
        'blood_type',
        'emergency_phone',
        'id_image',
    ];
}
