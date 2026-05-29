<?php

namespace App\Http\Controllers;

use App\Models\Motor;
use App\Models\Transaction;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

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
            'notes'            => 'nullable|string|max:255',
            'transaction_date' => 'nullable|date',
        ]);

        $motor->transactions()->create([
            'customer_id'      => $motor->customer_id,
            'type'             => $validated['type'],
            'amount'           => $validated['amount'],
            'notes'            => $validated['notes'] ?? null,
            'transaction_date' => $validated['transaction_date'] ?? now(),
        ]);

        // إذا أصبح كشف الحساب مسدداً بعد هذه الدفعة، علِّم جميع القطع غير المدفوعة كمدفوعة
        $motor->load(['maintenanceOrders.parts', 'transactions']);

        $grandTotal = $motor->maintenanceOrders->sum('labor_cost')
            + $motor->maintenanceOrders->flatMap(fn($o) => $o->parts)->sum('total_cost');
        $paid = $motor->transactions->sum('amount');

        if ($grandTotal > 0 && $paid >= ($grandTotal - 0.009)) {
            foreach ($motor->maintenanceOrders as $order) {
                $order->parts()->where('is_paid', false)->update(['is_paid' => true]);
            }
        }

        return back()->with('success', 'تم تسجيل الدفعة بنجاح');
    }

    public function destroy(Transaction $transaction): RedirectResponse
    {
        // Remove linked accounting entry if it exists
        $transaction->accountEntry?->delete();

        $transaction->delete();

        return back()->with('success', 'تم حذف الدفعة وإزالتها من الصندوق');
    }
}
