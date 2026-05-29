<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// تشغيل تذكيرات الوثائق يومياً في الساعة 9 صباحاً
Schedule::command('documents:send-reminders')->dailyAt('09:00');
