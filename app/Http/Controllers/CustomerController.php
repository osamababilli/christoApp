<?php

namespace App\Http\Controllers;

use App\Models\AccountEntry;
use App\Models\Customer;
use App\Models\MaintenanceOrder;
use App\Models\Motor;
use App\Models\Part;
use App\Models\Transaction;
use Illuminate\Http\RedirectResponse;
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
                'id'                    => $c->id,
                'name'                  => $c->name,
                'phone'                 => $c->phone,
                'email'                 => $c->email,
                'notes'                 => $c->notes,
                'motors_count'          => $c->motors_count,
                'is_loyal'              => $c->motors_count >= 3,
                'account_type'          => $c->account_type ?? 'direct',
                'opening_balance'       => (float) ($c->opening_balance ?? 0),
                'opening_balance_notes' => $c->opening_balance_notes,
                'created_at'            => $c->created_at->format('Y-m-d'),
            ]),
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'                  => 'required|string|max:255',
            'phone'                 => 'required|string|max:50|unique:customers,phone',
            'email'                 => 'nullable|email|max:255',
            'notes'                 => 'nullable|string|max:1000',
            'account_type'          => 'required|in:direct,account',
            'opening_balance'       => 'nullable|numeric|min:0',
            'opening_balance_notes' => 'nullable|string|max:500',
        ]);

        Customer::create($validated);

        return back()->with('success', 'تم إضافة العميل بنجاح');
    }

    public function update(Request $request, Customer $customer): RedirectResponse
    {
        $validated = $request->validate([
            'name'                  => 'required|string|max:255',
            'phone'                 => 'required|string|max:50|unique:customers,phone,' . $customer->id,
            'email'                 => 'nullable|email|max:255',
            'notes'                 => 'nullable|string|max:1000',
            'account_type'          => 'required|in:direct,account',
            'opening_balance'       => 'nullable|numeric|min:0',
            'opening_balance_notes' => 'nullable|string|max:500',
        ]);

        $customer->update($validated);

        return back()->with('success', 'تم تحديث بيانات العميل');
    }

    public function destroy(Customer $customer): RedirectResponse
    {
        if ($customer->motors()->exists()) {
            return back()->with('error', "لا يمكن حذف العميل \"{$customer->name}\" لوجود قيود استلام مرتبطة به — احذف القيود أولاً أو قم بنقلها لعميل آخر");
        }

        $customer->delete();

        return redirect()->route('customers.index')->with('success', 'تم حذف العميل بنجاح');
    }

    public function updateType(Request $request, Customer $customer): RedirectResponse
    {
        $validated = $request->validate([
            'account_type' => 'required|in:direct,account',
        ]);

        $customer->update(['account_type' => $validated['account_type']]);

        return back()->with('success', 'تم تحديث نوع الحساب بنجاح');
    }

    public function storeTransaction(Request $request, Customer $customer): RedirectResponse
    {
        if ($customer->account_type !== 'account') {
            return back()->withErrors(['type' => 'هذا العميل لا يملك حساباً جارياً']);
        }

        $validated = $request->validate([
            'type'             => 'required|in:payment,discount',
            'amount'           => 'required|numeric|min:0.01',
            'notes'            => 'nullable|string|max:255',
            'transaction_date' => 'nullable|date',
        ]);

        $transaction = Transaction::create([
            'customer_id'      => $customer->id,
            'motor_id'         => null,
            'type'             => $validated['type'],
            'amount'           => $validated['amount'],
            'notes'            => $validated['notes'] ?? null,
            'transaction_date' => $validated['transaction_date'] ?? now(),
        ]);

        // Sync payment to treasury (income); discounts are write-offs, not cash in
        if ($validated['type'] === 'payment') {
            AccountEntry::create([
                'type'           => 'income',
                'amount'         => $validated['amount'],
                'description'    => "دفعة حساب جاري — {$customer->name}",
                'entry_date'     => $validated['transaction_date'] ?? today(),
                'notes'          => $validated['notes'] ?? null,
                'transaction_id' => $transaction->id,
            ]);
        }

        return back()->with('success', 'تم تسجيل الدفعة وإضافتها للصندوق');
    }

    public function statement(Customer $customer): Response
    {
        $customer->loadCount('motors');
        $isAccount = $customer->account_type === 'account';

        $motors = $customer->motors()
            ->with(['maintenanceOrders.parts.supplier', 'transactions', 'category'])
            ->latest('received_at')
            ->get()
            ->map(function ($motor) use ($isAccount) {
                $labor      = $motor->maintenanceOrders->sum('labor_cost');
                $parts      = $motor->maintenanceOrders->flatMap(fn($o) => $o->parts)->sum('total_cost');
                $grandTotal = $labor + $parts;
                $paid       = $isAccount ? 0 : (float) $motor->transactions->sum('amount');

                return [
                    'id'               => $motor->id,
                    'reference_number' => $motor->reference_number,
                    'status_label'     => Motor::statusLabel($motor->status),
                    'received_at'      => $motor->received_at?->format('Y-m-d'),
                    'delivered_at'     => $motor->delivered_at?->format('Y-m-d'),
                    'category_name'    => $motor->category?->name,
                    'notes'            => $motor->notes,
                    'grand_total'      => (float) $grandTotal,
                    'total_paid'       => (float) $paid,
                    'remaining'        => (float) ($grandTotal - $paid),
                    'maintenance_orders' => $motor->maintenanceOrders->map(fn($o) => [
                        'stage'       => $o->stage,
                        'description' => $o->description,
                        'status_label'=> MaintenanceOrder::statusLabel($o->status),
                        'started_at'  => $o->started_at?->format('Y-m-d'),
                        'completed_at'=> $o->completed_at?->format('Y-m-d'),
                        'labor_cost'  => (float) $o->labor_cost,
                        'parts'       => $o->parts->map(fn($p) => [
                            'part_name'     => $p->part_name,
                            'type_label'    => Part::typeLabel($p->type),
                            'purchased_by'  => $p->purchased_by,
                            'quantity'      => (float) $p->quantity,
                            'unit_cost'     => (float) $p->unit_cost,
                            'unit_price'    => (float) $p->unit_price,
                            'total_cost'    => (float) $p->total_cost,
                            'supplier_name' => $p->supplier?->name,
                        ]),
                    ]),
                    // For direct customers only; account customers have no per-motor transactions
                    'transactions' => $isAccount ? [] : $motor->transactions->map(fn($t) => [
                        'type_label'       => $t->type === 'payment' ? 'دفعة' : 'خصم',
                        'amount'           => (float) $t->amount,
                        'notes'            => $t->notes,
                        'transaction_date' => $t->transaction_date,
                    ])->toArray(),
                ];
            });

        // Customer-level transactions for account type
        $customerTransactions = $isAccount
            ? $customer->transactions()
                ->whereNull('motor_id')
                ->orderBy('transaction_date')
                ->orderBy('id')
                ->get()
                ->map(fn($t) => [
                    'type'             => $t->type,
                    'type_label'       => $t->type === 'payment' ? 'دفعة' : 'خصم',
                    'amount'           => (float) $t->amount,
                    'notes'            => $t->notes,
                    'transaction_date' => $t->transaction_date instanceof \Carbon\Carbon
                        ? $t->transaction_date->format('Y-m-d')
                        : $t->transaction_date,
                ])
            : collect();

        $openingBalance = (float) ($customer->opening_balance ?? 0);
        $totalInvoiced  = (float) $motors->sum('grand_total');
        $totalPaid      = $isAccount
            ? (float) $customerTransactions->sum('amount')
            : (float) $motors->sum('total_paid');

        $summary = [
            'total_motors'    => $motors->count(),
            'total_invoiced'  => $totalInvoiced,
            'opening_balance' => $openingBalance,
            'total_paid'      => $totalPaid,
            'total_remaining' => $totalInvoiced + $openingBalance - $totalPaid,
        ];

        return Inertia::render('print/customer-statement', [
            'customer' => [
                'id'                    => $customer->id,
                'name'                  => $customer->name,
                'phone'                 => $customer->phone,
                'email'                 => $customer->email,
                'notes'                 => $customer->notes,
                'is_loyal'              => $customer->motors_count >= 3,
                'account_type'          => $customer->account_type ?? 'direct',
                'opening_balance'       => $openingBalance,
                'opening_balance_notes' => $customer->opening_balance_notes,
                'created_at'            => $customer->created_at->format('Y-m-d'),
            ],
            'motors'               => $motors,
            'customer_transactions' => $customerTransactions->values(),
            'summary'              => $summary,
            'printed_at'           => now()->format('Y-m-d H:i'),
        ]);
    }

    public function show(Customer $customer): Response
    {
        $customer->loadCount('motors');
        $isAccount = $customer->account_type === 'account';

        $motors = $customer->motors()
            ->with(['maintenanceOrders.parts', 'transactions'])
            ->latest('received_at')
            ->get()
            ->map(function ($motor) use ($isAccount) {
                $labor      = $motor->maintenanceOrders->sum('labor_cost');
                $parts      = $motor->maintenanceOrders->flatMap(fn($o) => $o->parts)->sum('total_cost');
                $grandTotal = $labor + $parts;
                $paid       = $isAccount ? 0 : (float) $motor->transactions->sum('amount');
                $remaining  = $isAccount ? $grandTotal : $grandTotal - $paid;

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

        $totalInvoiced = (float) $motors->sum('grand_total');

        // For account customers, payments are at customer level
        $customerTransactions = $isAccount
            ? $customer->transactions()
                ->whereNull('motor_id')
                ->orderByDesc('transaction_date')
                ->get()
                ->map(fn($t) => [
                    'id'               => $t->id,
                    'type'             => $t->type,
                    'type_label'       => $t->type === 'payment' ? 'دفعة' : 'خصم',
                    'amount'           => (float) $t->amount,
                    'notes'            => $t->notes,
                    'transaction_date' => $t->transaction_date instanceof \Carbon\Carbon
                        ? $t->transaction_date->format('Y-m-d')
                        : $t->transaction_date,
                ])
            : collect();

        $openingBalance = (float) ($customer->opening_balance ?? 0);
        $totalPaid      = $isAccount ? (float) $customerTransactions->sum('amount') : (float) $motors->sum('total_paid');
        $totalRemaining = $totalInvoiced + $openingBalance - $totalPaid;

        return Inertia::render('authenticated/customers/show', [
            'customer' => [
                'id'                    => $customer->id,
                'name'                  => $customer->name,
                'phone'                 => $customer->phone,
                'email'                 => $customer->email,
                'notes'                 => $customer->notes,
                'motors_count'          => $customer->motors_count,
                'is_loyal'              => $customer->motors_count >= 3,
                'account_type'          => $customer->account_type ?? 'direct',
                'opening_balance'       => $openingBalance,
                'opening_balance_notes' => $customer->opening_balance_notes,
                'created_at'            => $customer->created_at->format('Y-m-d'),
            ],
            'motors'               => $motors,
            'customer_transactions' => $customerTransactions->values(),
            'summary' => [
                'total_motors'    => $motors->count(),
                'total_invoiced'  => $totalInvoiced,
                'opening_balance' => $openingBalance,
                'total_paid'      => $totalPaid,
                'total_remaining' => $totalRemaining,
            ],
        ]);
    }
}
