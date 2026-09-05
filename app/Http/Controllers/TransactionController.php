<?php

namespace App\Http\Controllers;

use App\Models\AccountEntry;
use App\Models\Motor;
use App\Models\Transaction;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TransactionController extends Controller
{
    public function store(Request $request, Motor $motor): RedirectResponse
    {
        $motor->load('customer');
        if ($motor->customer?->account_type === 'account') {
            return back()->withErrors(['type' => 'هذا العميل يملك حساباً جارياً — الدفع يتم عبر صفحة العميل']);
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

        DB::transaction(function () use ($validated, $motor) {
            // Lock the motor row so two simultaneous payments can't both pass the remaining check
            Motor::whereKey($motor->id)->lockForUpdate()->first();

            $remaining = $motor->outstandingBalance();
            if ($validated['amount'] > $remaining + 0.009) {
                throw ValidationException::withMessages([
                    'amount' => sprintf(
                        'المبلغ ($%s) يتجاوز المتبقي على هذا القيد ($%s)',
                        number_format((float) $validated['amount'], 2),
                        number_format(max($remaining, 0), 2),
                    ),
                ]);
            }

            $transaction = $motor->transactions()->create([
                'customer_id'      => $motor->customer_id,
                'type'             => $validated['type'],
                'payment_method'   => $validated['type'] === 'payment' ? ($validated['payment_method'] ?? null) : null,
                'account_name'     => $validated['type'] === 'payment' ? ($validated['account_name'] ?? null) : null,
                'reference_no'     => $validated['type'] === 'payment' ? ($validated['reference_no'] ?? null) : null,
                'amount'           => $validated['amount'],
                'notes'            => $validated['notes'] ?? null,
                'transaction_date' => $validated['transaction_date'] ?? now(),
            ]);

            // Sync payment to treasury — only cash payments, not discounts
            if ($validated['type'] === 'payment') {
                AccountEntry::create([
                    'type'           => 'income',
                    'amount'         => $validated['amount'],
                    'description'    => "دفعة — {$motor->customer->name} ({$motor->reference_number})",
                    'entry_date'     => $validated['transaction_date'] ?? today(),
                    'notes'          => $validated['notes'] ?? null,
                    'transaction_id' => $transaction->id,
                ]);
            }

            if ($motor->outstandingBalance() <= 0.009) {
                $motor->markPartsPaid();
            }
        });

        return back()->with('success', 'تم تسجيل الدفعة وإضافتها للصندوق');
    }

    public function destroy(Transaction $transaction): RedirectResponse
    {
        DB::transaction(function () use ($transaction) {
            $transaction->accountEntry?->delete();
            $transaction->delete();
        });

        return back()->with('success', 'تم حذف الدفعة وإزالتها من الصندوق');
    }
}
