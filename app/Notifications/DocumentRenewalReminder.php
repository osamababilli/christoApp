<?php
namespace App\Notifications;

use App\Models\ShopDocument;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class DocumentRenewalReminder extends Notification
{
    use Queueable;

    public function __construct(public ShopDocument $document) {}

    public function via(object $notifiable): array { return ['mail']; }

    public function toMail(object $notifiable): MailMessage
    {
        $daysLeft = $this->document->days_remaining;
        return (new MailMessage)
            ->subject("تذكير: تجديد وثيقة — {$this->document->name}")
            ->greeting("مرحباً {$notifiable->name}")
            ->line("هذا تذكير بأن الوثيقة التالية تستحق التجديد قريباً:")
            ->line("**{$this->document->name}**")
            ->line("تاريخ التجديد: {$this->document->renewal_date->format('Y-m-d')}")
            ->line("المتبقي: {$daysLeft} يوم")
            ->action('عرض الوثائق', url('/documents'))
            ->line("يرجى اتخاذ الإجراءات اللازمة قبل انتهاء الصلاحية.");
    }
}
