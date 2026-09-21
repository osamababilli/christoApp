<?php

namespace App\Http\Controllers;

use App\Models\AccountEntry;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Motor;
use App\Models\Transaction;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
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
                'client_type'           => $c->client_type ?? 'individual',
                'client_type_label'     => Customer::clientTypeLabel($c->client_type),
                'created_at'            => $c->created_at->format('Y-m-d'),
            ]),
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        [$customerFields, $contacts] = $this->validateCustomer($request);

        $customer = Customer::create($customerFields);
        $customer->contacts()->createMany($contacts);

        return back()->with('success', 'تم إضافة العميل بنجاح');
    }

    public function update(Request $request, Customer $customer): RedirectResponse
    {
        [$customerFields, $contacts] = $this->validateCustomer($request, $customer);

        $customer->update($customerFields);
        $customer->contacts()->delete();
        $customer->contacts()->createMany($contacts);

        return back()->with('success', 'تم تحديث بيانات العميل');
    }

    /**
     * @return array{0: array<string, mixed>, 1: array<int, array{name: string, phone: string}>}
     */
    private function validateCustomer(Request $request, ?Customer $customer = null): array
    {
        $clientType    = $request->input('client_type', 'individual');
        $needsAddress  = in_array($clientType, ['garage', 'company'], true);
        $needsContacts = in_array($clientType, ['military', 'garage', 'company'], true);

        $validated = $request->validate([
            'client_type'           => 'required|in:individual,military,garage,company',
            'name'                  => 'required|string|max:255',
            'phone'                 => ['required', 'string', 'max:50', Rule::unique('customers', 'phone')->ignore($customer?->id)],
            'email'                 => 'nullable|email|max:255',
            'notes'                 => 'nullable|string|max:1000',
            'account_type'          => 'required|in:direct,account',
            'opening_balance'       => 'nullable|numeric|min:0',
            'opening_balance_notes' => 'nullable|string|max:500',
            'address'               => [$needsAddress ? 'required' : 'nullable', 'string', 'max:255'],
            'responsible_name'      => [$clientType === 'military' ? 'required' : 'nullable', 'string', 'max:255'],
            'accounting_name'       => [$needsAddress ? 'required' : 'nullable', 'string', 'max:255'],
            'accounting_phone'      => [$needsAddress ? 'required' : 'nullable', 'string', 'max:50'],
            'accounting_email'      => 'nullable|email|max:255',
            'contacts'              => $needsContacts ? ['required', 'array', 'min:1'] : ['nullable', 'array'],
            'contacts.*.name'       => 'required_with:contacts|string|max:255',
            'contacts.*.phone'      => 'required_with:contacts|string|max:50',
        ]);

        $contacts = $validated['contacts'] ?? [];
        unset($validated['contacts']);

        // Garage/company accounting fields are irrelevant to other client types
        if (!$needsAddress) {
            $validated['accounting_name']  = null;
            $validated['accounting_phone'] = null;
            $validated['address']          = null;
        }
        if ($clientType !== 'military') {
            $validated['responsible_name'] = null;
        }
        if (!$needsContacts) {
            $contacts = [];
        }

        return [$validated, $contacts];
    }

    public function destroy(Customer $customer): RedirectResponse
    {
        $blockers = array_filter([
            $customer->motors()->withTrashed()->exists()   ? 'قيود استلام' : null,
            $customer->invoices()->withTrashed()->exists() ? 'فواتير'       : null,
            $customer->transactions()->withTrashed()->exists() ? 'دفعات'    : null,
            $customer->quotations()->withTrashed()->exists() ? 'عروض أسعار' : null,
        ]);

        if ($blockers) {
            return back()->with('error', "لا يمكن حذف العميل \"{$customer->name}\" لوجود " . implode(' و', $blockers) . ' مرتبطة به');
        }

        // A customer with no records at all can go for good, freeing the phone number for re-use
        $customer->contacts()->delete();
        $customer->forceDelete();

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
            'payment_method'   => 'nullable|in:cash,whish,omt,check',
            'account_name'     => 'nullable|string|max:255',
            'reference_no'     => 'nullable|string|max:255',
            'notes'            => 'nullable|string|max:255',
            'transaction_date' => 'nullable|date',
        ]);

        DB::transaction(function () use ($validated, $customer) {
            $transaction = Transaction::create([
                'customer_id'      => $customer->id,
                'motor_id'         => null,
                'type'             => $validated['type'],
                'payment_method'   => $validated['type'] === 'payment' ? ($validated['payment_method'] ?? null) : null,
                'account_name'     => $validated['type'] === 'payment' ? ($validated['account_name'] ?? null) : null,
                'reference_no'     => $validated['type'] === 'payment' ? ($validated['reference_no'] ?? null) : null,
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
        });

        return back()->with('success', 'تم تسجيل الدفعة وإضافتها للصندوق');
    }

    public function statement(Request $request, Customer $customer): Response
    {
        $customer->loadCount('motors');
        $customer->load('contacts');

        $fromDate = $request->filled('from') ? $request->date('from')->startOfDay() : null;
        $toDate   = $request->filled('to') ? $request->date('to')->endOfDay() : null;

        $invoicesQuery = $customer->invoices()->with('transactions');
        if ($fromDate) {
            $invoicesQuery->whereDate('issued_date', '>=', $fromDate);
        }
        if ($toDate) {
            $invoicesQuery->whereDate('issued_date', '<=', $toDate);
        }
        $invoices = $invoicesQuery
            ->latest('issued_date')
            ->get()
            ->map(fn(Invoice $invoice) => $this->presentInvoice($invoice));

        // كل الدفعات على هذا العميل — سواء مرتبطة بفاتورة محددة أو دفعة عامة على الحساب
        $paymentsQuery = $customer->transactions()->with('invoice');
        if ($fromDate) {
            $paymentsQuery->whereDate('transaction_date', '>=', $fromDate);
        }
        if ($toDate) {
            $paymentsQuery->whereDate('transaction_date', '<=', $toDate);
        }
        $payments = $paymentsQuery
            ->orderBy('transaction_date')
            ->orderBy('id')
            ->get()
            ->map(fn($t) => [
                'type'             => $t->type,
                'type_label'       => $t->type === 'payment' ? 'دفعة' : 'خصم',
                'amount'           => (float) $t->amount,
                'payment_method'   => $t->payment_method,
                'payment_method_label' => Transaction::paymentMethodLabel($t->payment_method),
                'reference_no'     => $t->reference_no,
                'invoice_number'   => $t->invoice?->invoice_number,
                'notes'            => $t->notes,
                'transaction_date' => $t->transaction_date instanceof \Carbon\Carbon
                    ? $t->transaction_date->format('Y-m-d')
                    : $t->transaction_date,
            ]);

        // الرصيد المرحّل يخص بداية الحساب فقط، لذا يظهر فقط عند عدم تحديد تاريخ بداية للفلترة
        $openingBalance = ! $fromDate ? (float) ($customer->opening_balance ?? 0) : 0.0;
        $totalInvoiced  = (float) $invoices->sum('amount');
        $totalPaid      = (float) $payments->sum('amount');

        $summary = [
            'total_invoices'  => $invoices->count(),
            'total_invoiced'  => $totalInvoiced,
            'opening_balance' => $openingBalance,
            'total_paid'      => $totalPaid,
            'total_remaining' => $totalInvoiced + $openingBalance - $totalPaid,
        ];

        return Inertia::render('print/customer-statement', [
            'customer' => array_merge($this->presentCustomer($customer), [
                'is_loyal' => $customer->motors_count >= 3,
            ]),
            'invoices'    => $invoices,
            'payments'    => $payments->values(),
            'summary'     => $summary,
            'printed_at'  => now()->format('Y-m-d H:i'),
            'filters'     => [
                'from' => $fromDate?->format('Y-m-d'),
                'to'   => $toDate?->format('Y-m-d'),
            ],
            // رقم مرجعي فريد لهذه النسخة من كشف الحساب — يُولَّد عند كل طباعة، غير مرتبط بترقيم الفواتير
            'statement_number' => sprintf(
                'STMT-%d-%s-%s',
                $customer->id,
                now()->format('Ymd'),
                Str::upper(Str::random(4)),
            ),
        ]);
    }

    public function show(Customer $customer): Response
    {
        $customer->loadCount('motors');
        $customer->load('contacts');

        $motors = $customer->motors()
            ->latest('received_at')
            ->get()
            ->map(fn(Motor $motor) => [
                'id'               => $motor->id,
                'reference_number' => $motor->reference_number,
                'status'           => $motor->status,
                'status_label'     => Motor::statusLabel($motor->status),
                'received_at'      => $motor->received_at?->format('Y-m-d'),
                'delivered_at'     => $motor->delivered_at?->format('Y-m-d'),
            ]);

        $invoices = $customer->invoices()
            ->with('transactions')
            ->latest('issued_date')
            ->get()
            ->map(fn(Invoice $invoice) => $this->presentInvoice($invoice));

        // On-account (not tied to a specific invoice) transactions
        $customerTransactions = $customer->transactions()
            ->whereNull('invoice_id')
            ->orderByDesc('transaction_date')
            ->get()
            ->map(fn($t) => [
                'id'               => $t->id,
                'type'             => $t->type,
                'type_label'       => $t->type === 'payment' ? 'دفعة' : 'خصم',
                'amount'           => (float) $t->amount,
                'payment_method'   => $t->payment_method,
                'payment_method_label' => Transaction::paymentMethodLabel($t->payment_method),
                'reference_no'     => $t->reference_no,
                'notes'            => $t->notes,
                'transaction_date' => $t->transaction_date instanceof \Carbon\Carbon
                    ? $t->transaction_date->format('Y-m-d')
                    : $t->transaction_date,
            ]);

        $openingBalance = (float) ($customer->opening_balance ?? 0);
        $totalInvoiced  = (float) $invoices->sum('amount');
        $totalPaid      = (float) $customer->transactions()->sum('amount');
        $totalRemaining = $totalInvoiced + $openingBalance - $totalPaid;

        return Inertia::render('authenticated/customers/show', [
            'customer' => array_merge($this->presentCustomer($customer), [
                'motors_count' => $customer->motors_count,
                'is_loyal'     => $customer->motors_count >= 3,
            ]),
            'motors'               => $motors,
            'invoices'             => $invoices,
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

    private function presentCustomer(Customer $customer): array
    {
        return [
            'id'                    => $customer->id,
            'name'                  => $customer->name,
            'phone'                 => $customer->phone,
            'email'                 => $customer->email,
            'notes'                 => $customer->notes,
            'account_type'          => $customer->account_type ?? 'direct',
            'opening_balance'       => (float) ($customer->opening_balance ?? 0),
            'opening_balance_notes' => $customer->opening_balance_notes,
            'client_type'           => $customer->client_type ?? 'individual',
            'client_type_label'     => Customer::clientTypeLabel($customer->client_type),
            'address'               => $customer->address,
            'responsible_name'      => $customer->responsible_name,
            'accounting_name'       => $customer->accounting_name,
            'accounting_phone'      => $customer->accounting_phone,
            'accounting_email'      => $customer->accounting_email,
            'contacts'              => $customer->contacts->map(fn($c) => [
                'name'  => $c->name,
                'phone' => $c->phone,
            ])->values(),
            'created_at'            => $customer->created_at->format('Y-m-d'),
        ];
    }

    private function presentInvoice(Invoice $invoice): array
    {
        $paid      = (float) $invoice->transactions->sum('amount');
        $amount    = (float) $invoice->amount;

        return [
            'id'             => $invoice->id,
            'invoice_number' => $invoice->invoice_number,
            'description'    => $invoice->description,
            'issued_date'    => $invoice->issued_date->format('Y-m-d'),
            'amount'         => $amount,
            'paid'           => $paid,
            'remaining'      => (float) ($amount - $paid),
        ];
    }
}
