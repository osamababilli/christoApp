<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\MaintenanceOrder;
use App\Models\Motor;
use App\Models\Part;
use App\Models\Supplier;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function index(Request $request): Response
    {
        $from = $request->date_from ? $request->date('date_from')->startOfDay() : null;
        $to   = $request->date_to   ? $request->date('date_to')->endOfDay()     : null;

        $motorQ       = Motor::query()->when($from, fn($q) => $q->where('received_at', '>=', $from))->when($to, fn($q) => $q->where('received_at', '<=', $to));
        $maintenanceQ = MaintenanceOrder::query()->when($from, fn($q) => $q->where('started_at', '>=', $from))->when($to, fn($q) => $q->where('started_at', '<=', $to));
        $partQ        = Part::query()->when($from, fn($q) => $q->where('created_at', '>=', $from))->when($to, fn($q) => $q->where('created_at', '<=', $to));
        $txQ          = Transaction::query()->when($from, fn($q) => $q->where('transaction_date', '>=', $from))->when($to, fn($q) => $q->where('transaction_date', '<=', $to));

        $totalLabor  = (float) (clone $maintenanceQ)->sum('labor_cost');
        $totalParts  = (float) (clone $partQ)->sum('total_cost');
        $paidParts   = (float) (clone $partQ)->where('is_paid', true)->sum('total_cost');
        $unpaidParts = (float) (clone $partQ)->where('is_paid', false)->sum('total_cost');
        $totalPaid   = (float) (clone $txQ)->where('type', 'payment')->sum('amount');
        $totalDisc   = (float) (clone $txQ)->where('type', 'discount')->sum('amount');

        $motorsByStatus = (clone $motorQ)
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get()
            ->mapWithKeys(fn($r) => [$r->status => (int) $r->count]);

        $maintenanceByStatus = (clone $maintenanceQ)
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get()
            ->mapWithKeys(fn($r) => [$r->status => (int) $r->count]);

        $partsByType = (clone $partQ)
            ->select('type', DB::raw('count(*) as count'), DB::raw('sum(total_cost) as total'))
            ->groupBy('type')
            ->get()
            ->map(fn($r) => [
                'type'  => $r->type,
                'label' => Part::typeLabel($r->type),
                'count' => (int) $r->count,
                'total' => (float) $r->total,
            ])
            ->values();

        $recentMotors = (clone $motorQ)
            ->with('customer')
            ->latest('received_at')
            ->take(5)
            ->get()
            ->map(fn($m) => [
                'id'               => $m->id,
                'reference_number' => $m->reference_number,
                'customer_name'    => $m->customer->name,
                'status'           => $m->status,
                'status_label'     => Motor::statusLabel($m->status),
                'received_at'      => $m->received_at?->format('Y-m-d'),
            ]);

        return Inertia::render('authenticated/reports', [
            'financial' => [
                'total_labor'  => $totalLabor,
                'total_parts'  => $totalParts,
                'paid_parts'   => $paidParts,
                'unpaid_parts' => $unpaidParts,
                'grand_total'  => $totalLabor + $totalParts,
                'total_paid'   => $totalPaid + $totalDisc,
            ],
            'motors_by_status'      => $motorsByStatus,
            'maintenance_by_status' => $maintenanceByStatus,
            'parts_by_type'         => $partsByType,
            'recent_motors'         => $recentMotors,
            'totals' => [
                'motors'      => (clone $motorQ)->count(),
                'customers'   => Customer::count(),
                'suppliers'   => Supplier::count(),
                'maintenance' => (clone $maintenanceQ)->count(),
                'parts'       => (clone $partQ)->count(),
            ],
            'filters' => $request->only(['date_from', 'date_to']),
        ]);
    }
}
