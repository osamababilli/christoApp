<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    public const DOCUMENT_TYPES = ['هوية', 'باسبور', 'دفتر سواقة', 'بطاقة لاجئ'];

    protected $fillable = [
        'full_name',
        'id_number',
        'document_type',
        'nationality',
        'blood_type',
        'emergency_phone',
        'emergency_contact_name',
        'emergency_contact_relationship',
        'id_image',
    ];
}
