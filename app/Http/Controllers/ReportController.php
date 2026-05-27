<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\MaintenanceOrder;
use App\Models\Motor;
use App\Models\Part;
use App\Models\Supplier;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function index(): Response
    {
        $totalLabor  = (float) MaintenanceOrder::sum('labor_cost');
        $totalParts  = (float) Part::sum('total_cost');
        $paidParts   = (float) Part::where('is_paid', true)->sum('total_cost');
        $unpaidParts = (float) Part::where('is_paid', false)->sum('total_cost');

        $motorsByStatus = Motor::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get()
            ->mapWithKeys(fn($r) => [$r->status => (int) $r->count]);

        $maintenanceByStatus = MaintenanceOrder::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get()
            ->mapWithKeys(fn($r) => [$r->status => (int) $r->count]);

        $partsByType = Part::select('type', DB::raw('count(*) as count'), DB::raw('sum(total_cost) as total'))
            ->groupBy('type')
            ->get()
            ->map(fn($r) => [
                'type'  => $r->type,
                'label' => Part::typeLabel($r->type),
                'count' => (int) $r->count,
                'total' => (float) $r->total,
            ])
            ->values();

        $recentMotors = Motor::with('customer')
            ->latest()
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
            ],
            'motors_by_status'      => $motorsByStatus,
            'maintenance_by_status' => $maintenanceByStatus,
            'parts_by_type'         => $partsByType,
            'recent_motors'         => $recentMotors,
            'totals' => [
                'motors'      => Motor::count(),
                'customers'   => Customer::count(),
                'suppliers'   => Supplier::count(),
                'maintenance' => MaintenanceOrder::count(),
                'parts'       => Part::count(),
            ],
        ]);
    }
}
