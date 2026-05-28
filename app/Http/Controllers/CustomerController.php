<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\MaintenanceOrder;
use App\Models\Motor;
use App\Models\Part;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function index(Request $request): Response
    {
        $customers = Customer::withCount('motors')
            ->when($request->search, fn($q, $s) => $q
                ->where('name', 'like', "%{$s}%")
                ->orWhere('phone', 'like', "%{$s}%")
            )
            ->orderByDesc('motors_count')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('authenticated/customers', [
            'customers' => $customers->through(fn($c) => [
                'id'           => $c->id,
                'name'         => $c->name,
                'phone'        => $c->phone,
                'email'        => $c->email,
                'motors_count' => $c->motors_count,
                'is_loyal'     => $c->motors_count >= 3,
                'created_at'   => $c->created_at->format('Y-m-d'),
            ]),
            'filters' => $request->only(['search']),
        ]);
    }

    public function show(Customer $customer): Response
    {
        $customer->loadCount('motors');

        $motors = $customer->motors()
            ->with(['maintenanceOrders.parts', 'transactions'])
            ->latest('received_at')
            ->get()
            ->map(function ($motor) {
                $labor      = $motor->maintenanceOrders->sum('labor_cost');
                $parts      = $motor->maintenanceOrders->flatMap(fn($o) => $o->parts)->sum('total_cost');
                $grandTotal = $labor + $parts;
                $paid       = $motor->transactions->sum('amount');
                $remaining  = $grandTotal - $paid;

                return [
                    'id'               => $motor->id,
                    'reference_number' => $motor->reference_number,
                    'status'           => $motor->status,
                    'status_label'     => Motor::statusLabel($motor->status),
                    'received_at'      => $motor->received_at?->format('Y-m-d'),
                    'delivered_at'     => $motor->delivered_at?->format('Y-m-d'),
                    'total_labor'      => (float) $labor,
                    'total_parts'      => (float) $parts,
                    'grand_total'      => (float) $grandTotal,
                    'total_paid'       => (float) $paid,
                    'remaining'        => (float) $remaining,
                ];
            });

        return Inertia::render('authenticated/customers/show', [
            'customer' => [
                'id'           => $customer->id,
                'name'         => $customer->name,
                'phone'        => $customer->phone,
                'email'        => $customer->email,
                'notes'        => $customer->notes,
                'motors_count' => $customer->motors_count,
                'is_loyal'     => $customer->motors_count >= 3,
                'created_at'   => $customer->created_at->format('Y-m-d'),
            ],
            'motors'  => $motors,
            'summary' => [
                'total_motors'    => $motors->count(),
                'total_invoiced'  => (float) $motors->sum('grand_total'),
                'total_paid'      => (float) $motors->sum('total_paid'),
                'total_remaining' => (float) $motors->sum('remaining'),
            ],
        ]);
    }
}
