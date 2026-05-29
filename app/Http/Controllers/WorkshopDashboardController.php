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
        $receivedToday      = Motor::whereDate('received_at', today())->count();
        $deliveredToday     = Motor::whereDate('delivered_at', today())->count();
        $allMotors = Motor::with(['customer', 'maintenanceOrders.parts', 'transactions'])->get();

        $unpaidTotal      = 0;
        $unpaidMotorsList = [];

        // Account customers: outstanding balance = total invoiced - customer-level payments
        $accountCustomerIds = $allMotors
            ->filter(fn($m) => ($m->customer->account_type ?? 'direct') === 'account')
            ->pluck('customer_id')
            ->unique();

        $accountOutstanding = 0;
        if ($accountCustomerIds->isNotEmpty()) {
            $accountInvoiced = $allMotors
                ->filter(fn($m) => $accountCustomerIds->contains($m->customer_id))
                ->sum(function ($motor) {
                    return $motor->maintenanceOrders->sum('labor_cost')
                        + $motor->maintenanceOrders->flatMap(fn($o) => $o->parts)->sum('total_cost');
                });

            $accountPaid = \App\Models\Transaction::whereIn('customer_id', $accountCustomerIds)
                ->whereNull('motor_id')
                ->sum('amount');

            $accountOutstanding = max(0, $accountInvoiced - $accountPaid);
        }

        foreach ($allMotors as $motor) {
            // Skip account-type customers — their balance is tracked at customer level
            if (($motor->customer->account_type ?? 'direct') === 'account') {
                continue;
            }

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
                'inWorkshop'          => $inWorkshop,
                'readyCount'          => $readyCount,
                'unpaidTotal'         => number_format((float) $unpaidTotal, 2),
                'unpaidCount'         => count($unpaidMotorsList),
                'accountOutstanding'  => number_format((float) $accountOutstanding, 2),
                'accountCount'        => $accountCustomerIds->count(),
                'receivedToday'       => $receivedToday,
                'deliveredToday'      => $deliveredToday,
            ],
            'recentMotors' => $recentMotors,
            'unpaidMotors' => $top5Unpaid,
        ]);
    }
}
