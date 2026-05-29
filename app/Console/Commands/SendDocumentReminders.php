<?php
namespace App\Console\Commands;

use App\Models\ShopDocument;
use App\Models\User;
use App\Notifications\DocumentRenewalReminder;
use Carbon\Carbon;
use Illuminate\Console\Command;

class SendDocumentReminders extends Command
{
    protected $signature   = 'documents:send-reminders';
    protected $description = 'إرسال تذكيرات تجديد الوثائق';

    public function handle(): void
    {
        $today = Carbon::today();

        $documents = ShopDocument::query()
            ->whereNotNull('renewal_date')
            ->whereNull('reminder_sent_at')
            ->get()
            ->filter(fn($doc) =>
                $doc->renewal_date->gte($today) &&
                $today->diffInDays($doc->renewal_date) <= $doc->reminder_days_before
            );

        if ($documents->isEmpty()) {
            $this->info('لا توجد وثائق تستحق التذكير اليوم.');
            return;
        }

        $admins = User::where('role', 'admin')->orWhere('role', 'super_admin')->get();
        if ($admins->isEmpty()) {
            $admins = User::limit(1)->get();
        }

        foreach ($documents as $doc) {
            foreach ($admins as $user) {
                try {
                    $user->notify(new DocumentRenewalReminder($doc));
                } catch (\Exception $e) {
                    $this->warn("فشل إرسال التذكير للمستخدم {$user->email}: {$e->getMessage()}");
                }
            }
            $doc->update(['reminder_sent_at' => now()]);
            $this->info("تم إرسال تذكير: {$doc->name}");
        }
    }
}
