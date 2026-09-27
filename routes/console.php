<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// تشغيل تذكيرات الوثائق يومياً في الساعة 9 صباحاً
Schedule::command('documents:send-reminders')->dailyAt('09:00');

// نسخة احتياطية يومية إلى جوجل درايف (قاعدة البيانات + ملفات المحل)، ثم تنظيف النسخ القديمة ومراقبة سلامتها
Schedule::command('backup:clean')->dailyAt('01:00');
Schedule::command('backup:run')->dailyAt('01:30');
Schedule::command('backup:monitor')->dailyAt('02:00');
