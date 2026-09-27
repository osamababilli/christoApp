<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Invoice;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class InvoiceController extends Controller
{
    public function index(Request $request): Response
    {
        $invoices = Invoice::with(['customer', 'motor', 'transactions'])
            ->when($request->customer_id, fn($q, $id) => $q->where('customer_id', $id))
            ->when($request->search, fn($q, $s) => $q
                ->where('invoice_number', 'like', "%{$s}%")
                ->orWhere('description', 'like', "%{$s}%")
                ->orWhereHas('customer', fn($cq) => $cq->where('name', 'like', "%{$s}%"))
            )
            ->latest('issued_date')
            ->latest('id')
            ->paginate(20)
            ->withQueryString();

        $customers = Customer::orderBy('name')->get(['id', 'name', 'phone']);

        return Inertia::render('authenticated/invoices', [
            'invoices' => $invoices->through(fn(Invoice $i) => $this->present($i)),
            'customers' => $customers,
            'filters'   => $request->only(['search', 'customer_id']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validated($request);

        Invoice::create($validated);

        return back()->with('success', 'تم إصدار الفاتورة بنجاح');
    }

    public function update(Request $request, Invoice $invoice): RedirectResponse
    {
        $validated = $this->validated($request, $invoice);

        $paid = $invoice->paidAmount();
        if ((float) $validated['amount'] < $paid - 0.009) {
            throw ValidationException::withMessages([
                'amount' => 'لا يمكن تخفيض مبلغ الفاتورة تحت ما دُفع عليها ($' . number_format($paid, 2) . ')',
            ]);
        }

        if ((int) $validated['customer_id'] !== $invoice->customer_id && $invoice->transactions()->exists()) {
            throw ValidationException::withMessages([
                'customer_id' => 'لا يمكن نقل فاتورة عليها دفعات إلى عميل آخر',
            ]);
        }

        $invoice->update($validated);

        return back()->with('success', 'تم تحديث الفاتورة بنجاح');
    }

    public function destroy(Invoice $invoice): RedirectResponse
    {
        if ($invoice->transactions()->exists()) {
            return back()->with('error', 'لا يمكن حذف فاتورة عليها دفعات مسجّلة — احذف الدفعات أولاً');
        }

        $invoice->delete();

        return back()->with('success', 'تم حذف الفاتورة');
    }

    public function print(Invoice $invoice): Response
    {
        $invoice->load(['customer', 'motor', 'transactions' => fn($q) => $q->latest('transaction_date')]);

        return Inertia::render('print/invoice', [
            'invoice' => array_merge($this->present($invoice), [
                'payments' => $invoice->transactions->map(fn(\App\Models\Transaction $t) => [
                    'id'             => $t->id,
                    'amount'         => (float) $t->amount,
                    'payment_method' => \App\Models\Transaction::paymentMethodLabel($t->payment_method),
                    'transaction_date' => $t->transaction_date?->format('Y-m-d'),
                    'notes'          => $t->notes,
                ]),
            ]),
        ]);
    }

    private function validated(Request $request, ?Invoice $invoice = null): array
    {
        return $request->validate([
            'customer_id'  => ['required', 'integer', Rule::exists('customers', 'id')],
            'motor_id'     => [
                'nullable', 'integer',
                Rule::exists('motors', 'id')->where(fn($q) => $q->where('customer_id', $request->customer_id)),
            ],
            'description'  => ['required', 'string', 'max:255'],
            'amount'       => ['required', 'numeric', 'min:0.01'],
            'issued_date'  => ['required', 'date'],
            'notes'        => ['nullable', 'string', 'max:1000'],
        ]);
    }

    private function present(Invoice $invoice): array
    {
        $paid      = (float) $invoice->transactions->sum('amount');
        $amount    = (float) $invoice->amount;
        $remaining = $amount - $paid;

        return [
            'id'               => $invoice->id,
            'invoice_number'   => $invoice->invoice_number,
            'customer_id'      => $invoice->customer_id,
            'customer_name'    => $invoice->customer?->name,
            'motor_id'         => $invoice->motor_id,
            'motor_reference'  => $invoice->motor?->reference_number,
            'description'      => $invoice->description,
            'amount'           => $amount,
            'paid'             => $paid,
            'remaining'        => $remaining,
            'is_paid'          => $remaining <= 0.009,
            'issued_date'      => $invoice->issued_date->format('Y-m-d'),
            'notes'            => $invoice->notes,
        ];
    }
}
