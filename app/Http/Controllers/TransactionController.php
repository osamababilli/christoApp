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

        return back()->with('success', 'تم تسجيل الدفعة بنجاح');
    }

    public function destroy(Transaction $transaction): RedirectResponse
    {
        $transaction->delete();

        return back()->with('success', 'تم حذف الدفعة');
    }
}
