<?php

namespace App\Http\Controllers;

use App\Models\Motor;
use App\Models\Part;
use App\Models\Transaction;
use Inertia\Inertia;
use Inertia\Response;

class WorkshopDashboardController extends Controller
{
    public function index(): Response
    {
        $inWorkshop = Motor::whereIn('status', ['in_workshop', 'in_progress'])->count();
        $readyCount = Motor::where('status', 'ready')->count();
        $overdueCount = Motor::whereIn('status', ['in_workshop', 'in_progress'])
            ->where('received_at', '<', now()->subDays(7))
            ->count();
        $unpaidTotal = Transaction::where('type', 'invoice')
            ->where('remaining_amount', '>', 0)
            ->sum('remaining_amount');

        $recentMotors = Motor::with('customer')
            ->latest()
            ->take(10)
            ->get()
            ->map(fn($m) => [
                'id'               => $m->id,
                'reference_number' => $m->reference_number,
                'customer_name'    => $m->customer->name,
                'customer_phone'   => $m->customer->phone,
                'brand'            => $m->brand,
                'model'            => $m->model,
                'status'           => $m->status,
                'status_label'     => Motor::statusLabel($m->status),
                'received_at'      => $m->received_at?->format('Y-m-d'),
            ]);

        return Inertia::render('authenticated/workshop-dashboard', [
            'stats' => [
                'inWorkshop'   => $inWorkshop,
                'readyCount'   => $readyCount,
                'overdueCount' => $overdueCount,
                'unpaidTotal'  => number_format((float) $unpaidTotal, 2),
            ],
            'recentMotors' => $recentMotors,
        ]);
    }
}
