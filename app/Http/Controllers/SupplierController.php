<?php

namespace App\Http\Controllers;

use App\Models\AccountEntry;
use App\Models\Part;
use App\Models\Supplier;
use App\Models\SupplierPayment;
use App\Models\SupplierPurchase;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SupplierController extends Controller
{
    public function index(Request $request): Response
    {
        $suppliers = Supplier::withCount('parts')
            ->when($request->search, fn($q, $s) => $q
                ->where('name', 'like', "%{$s}%")
                ->orWhere('phone', 'like', "%{$s}%")
                ->orWhere('shop_phone', 'like', "%{$s}%")
                ->orWhere('email', 'like', "%{$s}%")
                ->orWhere('specialty', 'like', "%{$s}%")
            )
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('authenticated/suppliers', [
            'suppliers' => $suppliers->through(fn($s) => [
                'id'          => $s->id,
                'name'        => $s->name,
                'address'     => $s->address,
                'phone'       => $s->phone,
                'shop_phone'  => $s->shop_phone,
                'email'       => $s->email,
                'specialty'   => $s->specialty,
                'notes'       => $s->notes,
                'parts_count' => $s->parts_count,
                'created_at'  => $s->created_at->format('Y-m-d'),
            ]),
            'filters' => $request->only(['search']),
        ]);
    }

    public function show(Supplier $supplier): Response
    {
        // Parts linked to motor orders
        $parts = $supplier->parts()
            ->with(['maintenance.motor'])
            ->latest()
            ->get()
            ->map(fn($p) => [
                'id'               => $p->id,
                'part_name'        => $p->part_name,
                'type'             => $p->type,
                'type_label'       => Part::typeLabel($p->type),
                'quantity'         => (float) $p->quantity,
                'unit_cost'        => (float) $p->unit_cost,
                'total_cost'       => (float) $p->total_cost,
                'is_paid'          => (bool) $p->is_paid,
                'motor_id'         => $p->maintenance?->motor_id,
                'reference_number' => $p->maintenance?->motor?->reference_number,
                'received_at'      => $p->maintenance?->motor?->received_at?->format('Y-m-d'),
                'created_at'       => $p->created_at->format('Y-m-d'),
            ]);

        // Direct purchases (not linked to motors)
        $purchases = $supplier->purchases()
            ->orderByDesc('purchase_date')
            ->orderByDesc('id')
            ->get()
            ->map(fn($p) => [
                'id'            => $p->id,
                'part_name'     => $p->part_name,
                'part_type'     => $p->part_type,
                'quantity'      => (float) $p->quantity,
                'unit_cost'     => (float) $p->unit_cost,
                'total_cost'    => (float) $p->total_cost,
                'purchase_date' => $p->purchase_date->format('Y-m-d'),
                'notes'         => $p->notes,
            ]);

        // Payments to supplier
        $payments = $supplier->payments()
            ->orderByDesc('payment_date')
            ->orderByDesc('id')
            ->get()
            ->map(fn($p) => [
                'id'           => $p->id,
                'amount'       => (float) $p->amount,
                'payment_date' => $p->payment_date->format('Y-m-d'),
                'notes'        => $p->notes,
            ]);

        // Balance: (motor parts cost + direct purchases) - payments
        $motorPartsCost   = (float) $parts->sum('total_cost');
        $directCost       = (float) $purchases->sum('total_cost');
        $totalOwed        = $motorPartsCost + $directCost;
        $totalPaid        = (float) $payments->sum('amount');
        $remaining        = $totalOwed - $totalPaid;

        return Inertia::render('authenticated/suppliers/show', [
            'supplier' => [
                'id'         => $supplier->id,
                'name'       => $supplier->name,
                'address'    => $supplier->address,
                'phone'      => $supplier->phone,
                'shop_phone' => $supplier->shop_phone,
                'email'      => $supplier->email,
                'specialty'  => $supplier->specialty,
                'notes'      => $supplier->notes,
                'created_at' => $supplier->created_at->format('Y-m-d'),
            ],
            'parts'     => $parts,
            'purchases' => $purchases,
            'payments'  => $payments,
            'summary'   => [
                'motor_parts_cost' => $motorPartsCost,
                'direct_cost'      => $directCost,
                'total_owed'       => $totalOwed,
                'total_paid'       => $totalPaid,
                'remaining'        => $remaining,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'       => 'required|string|max:255',
            'address'    => 'nullable|string|max:255',
            'phone'      => 'nullable|string|max:50',
            'shop_phone' => 'nullable|string|max:50',
            'email'      => 'nullable|email|max:255',
            'specialty'  => 'nullable|string|max:255',
            'notes'      => 'nullable|string|max:1000',
        ]);

        Supplier::create($validated);

        return back()->with('success', 'تم إضافة المورد بنجاح');
    }

    public function update(Request $request, Supplier $supplier): RedirectResponse
    {
        $validated = $request->validate([
            'name'       => 'required|string|max:255',
            'address'    => 'nullable|string|max:255',
            'phone'      => 'nullable|string|max:50',
            'shop_phone' => 'nullable|string|max:50',
            'email'      => 'nullable|email|max:255',
            'specialty'  => 'nullable|string|max:255',
            'notes'      => 'nullable|string|max:1000',
        ]);

        $supplier->update($validated);

        return back()->with('success', 'تم تحديث بيانات المورد');
    }

    public function destroy(Supplier $supplier): RedirectResponse
    {
        $totalOwed = (float) $supplier->parts()->sum('total_cost')
                   + (float) $supplier->purchases()->sum('total_cost');
        $totalPaid = (float) $supplier->payments()->sum('amount');
        $balance   = $totalOwed - $totalPaid;

        if ($balance > 0.01) {
            return back()->with('error', 'لا يمكن حذف المورد — يوجد رصيد مستحق بقيمة ' . number_format($balance, 2));
        }

        $supplier->delete();

        return back()->with('success', 'تم حذف المورد');
    }

    // ── Direct purchases ──────────────────────────────

    public function storePurchase(Request $request, Supplier $supplier): RedirectResponse
    {
        $validated = $request->validate([
            'part_name'     => 'required|string|max:255',
            'part_type'     => 'required|in:part,oil,transport,cleaning,other',
            'quantity'      => 'required|numeric|min:0.001',
            'unit_cost'     => 'required|numeric|min:0',
            'purchase_date' => 'required|date',
            'notes'         => 'nullable|string|max:500',
        ]);

        $validated['total_cost'] = $validated['quantity'] * $validated['unit_cost'];

        $supplier->purchases()->create($validated);

        return back()->with('success', 'تم تسجيل المشتريات');
    }

    public function destroyPurchase(SupplierPurchase $purchase): RedirectResponse
    {
        $purchase->delete();

        return back()->with('success', 'تم حذف المشترى');
    }

    // ── Payments to supplier ──────────────────────────

    public function storePayment(Request $request, Supplier $supplier): RedirectResponse
    {
        $validated = $request->validate([
            'amount'       => 'required|numeric|min:0.01',
            'payment_date' => 'required|date',
            'notes'        => 'nullable|string|max:500',
        ]);

        DB::transaction(function () use ($validated, $supplier) {
            // Record as expense in treasury
            $entry = AccountEntry::create([
                'type'        => 'expense',
                'amount'      => $validated['amount'],
                'description' => "دفعة للمورد — {$supplier->name}",
                'entry_date'  => $validated['payment_date'],
                'notes'       => $validated['notes'] ?? null,
            ]);

            $supplier->payments()->create([
                'amount'              => $validated['amount'],
                'payment_date'        => $validated['payment_date'],
                'notes'               => $validated['notes'] ?? null,
                'accounting_entry_id' => $entry->id,
            ]);
        });

        return back()->with('success', 'تم تسجيل الدفعة وخصمها من الصندوق');
    }

    public function destroyPayment(SupplierPayment $payment): RedirectResponse
    {
        DB::transaction(function () use ($payment) {
            if ($payment->accounting_entry_id) {
                AccountEntry::find($payment->accounting_entry_id)?->delete();
            }

            $payment->delete();
        });

        return back()->with('success', 'تم حذف الدفعة وإعادتها للصندوق');
    }
}
