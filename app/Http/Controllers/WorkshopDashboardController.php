<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Motor;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class WorkshopDashboardController extends Controller
{
    public function index(): Response
    {
        $inWorkshop     = Motor::whereIn('status', ['in_workshop', 'in_progress'])->count();
        $readyCount     = Motor::where('status', 'ready')->count();
        $receivedToday  = Motor::whereDate('received_at', today())->count();
        $deliveredToday = Motor::whereDate('delivered_at', today())->count();

        // Aggregates over the whole ledger are the expensive part — cache them briefly
        [$unpaid, $account] = Cache::remember('dashboard.balances', now()->addMinute(), fn () => [
            $this->unpaidDirectMotors(),
            $this->accountCustomersOutstanding(),
        ]);

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
                'unpaidTotal'        => number_format($unpaid['total'], 2),
                'unpaidCount'        => $unpaid['count'],
                'accountOutstanding' => number_format($account['total'], 2),
                'accountCount'       => $account['count'],
                'receivedToday'      => $receivedToday,
                'deliveredToday'     => $deliveredToday,
            ],
            'recentMotors' => $recentMotors,
            'unpaidMotors' => $unpaid['top'],
        ]);
    }

    /**
     * Per-motor balance for direct-pay customers, computed in SQL:
     * (labor + parts) − payments, keeping only motors that still owe something.
     */
    private function unpaidDirectMotors(): array
    {
        $labor = DB::table('maintenance_orders')
            ->selectRaw('motor_id, SUM(labor_cost) AS labor')
            ->whereNull('deleted_at')
            ->groupBy('motor_id');

        $parts = DB::table('parts_used')
            ->join('maintenance_orders', 'maintenance_orders.id', '=', 'parts_used.maintenance_id')
            ->selectRaw('maintenance_orders.motor_id, SUM(parts_used.total_cost) AS parts')
            ->whereNull('parts_used.deleted_at')
            ->whereNull('maintenance_orders.deleted_at')
            ->groupBy('maintenance_orders.motor_id');

        $paid = DB::table('transactions')
            ->selectRaw('motor_id, SUM(amount) AS paid')
            ->whereNull('deleted_at')
            ->whereNotNull('motor_id')
            ->groupBy('motor_id');

        $balances = DB::table('motors')
            ->join('customers', 'customers.id', '=', 'motors.customer_id')
            ->leftJoinSub($labor, 'l', 'l.motor_id', '=', 'motors.id')
            ->leftJoinSub($parts, 'p', 'p.motor_id', '=', 'motors.id')
            ->leftJoinSub($paid,  't', 't.motor_id', '=', 'motors.id')
            ->whereNull('motors.deleted_at')
            ->where('customers.account_type', '!=', 'account')
            ->selectRaw('
                motors.id, motors.reference_number, motors.status,
                customers.id AS customer_id, customers.name AS customer_name, customers.phone AS customer_phone,
                (COALESCE(l.labor, 0) + COALESCE(p.parts, 0) - COALESCE(t.paid, 0)) AS remaining
            ');

        $rows = DB::query()
            ->fromSub($balances, 'b')
            ->where('remaining', '>', 0.009)
            ->orderByDesc('remaining')
            ->get();

        return [
            'total' => (float) $rows->sum('remaining'),
            'count' => $rows->count(),
            'top'   => $rows->take(5)->map(fn($r) => [
                'id'               => $r->id,
                'reference_number' => $r->reference_number,
                'customer_id'      => $r->customer_id,
                'customer_name'    => $r->customer_name,
                'customer_phone'   => $r->customer_phone,
                'status'           => $r->status,
                'status_label'     => Motor::statusLabel($r->status),
                'remaining'        => number_format((float) $r->remaining, 2),
            ])->values()->all(),
        ];
    }

    /**
     * Account customers are billed through invoices, so their balance is
     * invoices + opening balance − all payments — the same formula the statement page uses.
     */
    private function accountCustomersOutstanding(): array
    {
        $customers = Customer::where('account_type', 'account')
            ->withSum('invoices as invoiced', 'amount')
            ->withSum('transactions as paid', 'amount')
            ->get();

        $total = $customers->sum(fn($c) => max(0,
            (float) ($c->invoiced ?? 0) + (float) ($c->opening_balance ?? 0) - (float) ($c->paid ?? 0)
        ));

        return ['total' => (float) $total, 'count' => $customers->count()];
    }
}
