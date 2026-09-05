<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    public const DOCUMENT_TYPES = ['هوية', 'باسبور', 'دفتر سواقة', 'بطاقة لاجئ'];

    public const SALARY_PERIODS = ['daily', 'weekly', 'monthly'];

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
        'salary_amount',
        'salary_period',
    ];

    protected $casts = [
        'salary_amount' => 'decimal:2',
    ];
}
