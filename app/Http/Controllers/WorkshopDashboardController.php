<?php

namespace App\Http\Controllers;

use App\Models\Motor;
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
        $receivedToday      = Motor::whereDate('received_at', today())->count();
        $deliveredToday     = Motor::whereDate('delivered_at', today())->count();
        $allMotors = Motor::with(['customer', 'maintenanceOrders.parts', 'transactions'])->get();

        $unpaidTotal = 0;
        $unpaidMotorsList = [];

        foreach ($allMotors as $motor) {
            $labor      = $motor->maintenanceOrders->sum('labor_cost');
            $parts      = $motor->maintenanceOrders->flatMap(fn($o) => $o->parts)->sum('total_cost');
            $grandTotal = $labor + $parts;
            $paid       = $motor->transactions->sum('amount');
            $remaining  = $grandTotal - $paid;

            if ($remaining > 0.009) {
                $unpaidTotal += $remaining;
                $unpaidMotorsList[] = [
                    'id'               => $motor->id,
                    'reference_number' => $motor->reference_number,
                    'customer_id'      => $motor->customer->id,
                    'customer_name'    => $motor->customer->name,
                    'customer_phone'   => $motor->customer->phone,
                    'status'           => $motor->status,
                    'status_label'     => Motor::statusLabel($motor->status),
                    'remaining'        => $remaining,
                ];
            }
        }

        usort($unpaidMotorsList, fn($a, $b) => $b['remaining'] <=> $a['remaining']);
        $top5Unpaid = array_slice($unpaidMotorsList, 0, 5);
        $top5Unpaid = array_map(fn($m) => array_merge($m, ['remaining' => number_format($m['remaining'], 2)]), $top5Unpaid);

        $recentMotors = Motor::with(['customer', 'category', 'receivedByEmployee'])
            ->latest()
            ->take(10)
            ->get()
            ->map(fn($m) => [
                'id'               => $m->id,
                'reference_number' => $m->reference_number,
                'customer_id'      => $m->customer->id,
                'customer_name'    => $m->customer->name,
                'customer_phone'   => $m->customer->phone,
                'status'           => $m->status,
                'status_label'     => Motor::statusLabel($m->status),
                'received_at'      => $m->received_at?->format('Y-m-d'),
                'category_name'    => $m->category?->name ?? null,
                'received_by_name' => $m->receivedByEmployee?->full_name ?? null,
            ]);

        return Inertia::render('authenticated/workshop-dashboard', [
            'stats' => [
                'inWorkshop'         => $inWorkshop,
                'readyCount'         => $readyCount,
                'overdueCount'       => $overdueCount,
                'unpaidTotal'        => number_format((float) $unpaidTotal, 2),
                'unpaidCount'        => count($unpaidMotorsList),
                'receivedToday'      => $receivedToday,
                'deliveredToday'     => $deliveredToday,
            ],
            'recentMotors' => $recentMotors,
            'unpaidMotors' => $top5Unpaid,
        ]);
    }
}
