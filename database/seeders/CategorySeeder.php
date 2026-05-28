<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'موتور',  'icon' => 'Bike',        'color' => 'blue'],
            ['name' => 'سيارة', 'icon' => 'Car',          'color' => 'indigo'],
            ['name' => 'غسالة', 'icon' => 'AirVent',      'color' => 'cyan'],
            ['name' => 'ثلاجة', 'icon' => 'Refrigerator', 'color' => 'teal'],
            ['name' => 'مكيف',  'icon' => 'Wind',         'color' => 'sky'],
            ['name' => 'أخرى',  'icon' => 'Wrench',       'color' => 'gray'],
        ];

        foreach ($categories as $category) {
            Category::firstOrCreate(
                ['name' => $category['name']],
                ['icon' => $category['icon'], 'color' => $category['color']]
            );
        }
    }
}
