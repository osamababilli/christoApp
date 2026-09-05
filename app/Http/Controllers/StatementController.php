<?php

namespace App\Http\Controllers;

use App\Models\AccountEntry;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Transaction;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class StatementController extends Controller
{
    public function index(Request $request): Response
    {
        $customers = Customer::orderBy('name')->get(['id', 'name', 'phone', 'account_type']);

        $selectedCustomer = null;
        $invoices         = [];

        if ($request->customer_id) {
            $customer = Customer::findOrFail($request->customer_id);

            $invoices = $customer->invoices()
                ->with('transactions')
                ->latest('issued_date')
                ->get()
                ->map(function (Invoice $invoice) {
                    $paid      = (float) $invoice->transactions->sum('amount');
                    $amount    = (float) $invoice->amount;
                    $remaining = $amount - $paid;

                    return [
                        'id'             => $invoice->id,
                        'invoice_number' => $invoice->invoice_number,
                        'description'    => $invoice->description,
                        'issued_date'    => $invoice->issued_date->format('Y-m-d'),
                        'amount'         => $amount,
                        'paid'           => $paid,
                        'remaining'      => $remaining,
                        'is_paid'        => $remaining <= 0.009,
                    ];
                })
                ->sortBy(fn($i) => $i['is_paid'] ? 1 : 0)
                ->values();

            $selectedCustomer = [
                'id'           => $customer->id,
                'name'         => $customer->name,
                'phone'        => $customer->phone,
                'account_type' => $customer->account_type ?? 'direct',
            ];
        }

        return Inertia::render('authenticated/statement', [
            'customers'         => $customers,
            'selected_customer' => $selectedCustomer,
            'invoices'          => $invoices,
        ]);
    }

    public function pay(Request $request, Customer $customer): RedirectResponse
    {
        $isAccount = $customer->account_type === 'account';

        $validated = $request->validate([
            'mode'                    => 'required|in:per_invoice,on_account',
            'payment_method'          => ['required', Rule::in(['cash', 'whish', 'omt', 'check'])],
            'account_name'            => ['nullable', 'string', 'max:255', Rule::requiredIf(in_array($request->payment_method, ['whish', 'omt']))],
            'reference_no'            => ['nullable', 'string', 'max:255', Rule::requiredIf($request->payment_method === 'check')],
            'notes'                   => 'nullable|string|max:255',
            'transaction_date'        => 'nullable|date',
            'amount'                  => 'required_if:mode,on_account|nullable|numeric|min:0.01',
            'allocations'             => 'required_if:mode,per_invoice|nullable|array|min:1',
            'allocations.*.invoice_id' => 'required_with:allocations|integer|exists:invoices,id',
            'allocations.*.amount'    => 'required_with:allocations|numeric|min:0.01',
        ]);

        if ($validated['mode'] === 'per_invoice' && $isAccount) {
            throw ValidationException::withMessages([
                'mode' => 'هذا العميل يملك حساباً جارياً — الدفع يتم كدفعة عامة على الحساب فقط',
            ]);
        }

        $paymentFields = [
            'payment_method' => $validated['payment_method'],
            'account_name'   => $validated['account_name'] ?? null,
            'reference_no'   => $validated['reference_no'] ?? null,
        ];

        DB::transaction(function () use ($validated, $customer, $paymentFields) {
            if ($validated['mode'] === 'per_invoice') {
                // Merge duplicate invoice ids so one request can't split an over-payment across rows
                $allocations = collect($validated['allocations'])
                    ->groupBy('invoice_id')
                    ->map(fn($rows) => (float) $rows->sum('amount'));

                $invoices = Invoice::whereIn('id', $allocations->keys())
                    ->where('customer_id', $customer->id)
                    ->lockForUpdate()
                    ->get()
                    ->keyBy('id');

                if ($invoices->count() !== $allocations->count()) {
                    throw ValidationException::withMessages([
                        'allocations' => 'إحدى الفواتير المختارة لا تعود لهذا العميل',
                    ]);
                }

                foreach ($allocations as $invoiceId => $amount) {
                    $invoice   = $invoices[$invoiceId];
                    $remaining = $invoice->remainingAmount();

                    if ($amount > $remaining + 0.009) {
                        throw ValidationException::withMessages([
                            'allocations' => sprintf(
                                'المبلغ المخصص للفاتورة %s ($%s) يتجاوز المتبقي عليها ($%s)',
                                $invoice->invoice_number,
                                number_format($amount, 2),
                                number_format(max($remaining, 0), 2),
                            ),
                        ]);
                    }

                    $transaction = $invoice->transactions()->create(array_merge($paymentFields, [
                        'customer_id'      => $customer->id,
                        'type'             => 'payment',
                        'amount'           => $amount,
                        'notes'            => $validated['notes'] ?? null,
                        'transaction_date' => $validated['transaction_date'] ?? now(),
                    ]));

                    AccountEntry::create([
                        'type'           => 'income',
                        'amount'         => $amount,
                        'description'    => "دفعة — {$customer->name} ({$invoice->invoice_number})",
                        'entry_date'     => $validated['transaction_date'] ?? today(),
                        'notes'          => $validated['notes'] ?? null,
                        'transaction_id' => $transaction->id,
                    ]);
                }
            } else {
                $transaction = Transaction::create(array_merge($paymentFields, [
                    'customer_id'      => $customer->id,
                    'motor_id'         => null,
                    'invoice_id'       => null,
                    'type'             => 'payment',
                    'amount'           => $validated['amount'],
                    'notes'            => $validated['notes'] ?? null,
                    'transaction_date' => $validated['transaction_date'] ?? now(),
                ]));

                AccountEntry::create([
                    'type'           => 'income',
                    'amount'         => $validated['amount'],
                    'description'    => "دفعة على الحساب — {$customer->name}",
                    'entry_date'     => $validated['transaction_date'] ?? today(),
                    'notes'          => $validated['notes'] ?? null,
                    'transaction_id' => $transaction->id,
                ]);
            }
        });

        return back()->with('success', 'تم تسجيل الدفعة وإضافتها للصندوق');
    }
}
