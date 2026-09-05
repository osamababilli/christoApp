<?php

namespace App\Http\Controllers;

use App\Models\MaintenanceOrder;
use App\Models\Part;
use App\Models\Supplier;
use App\Models\SupplierPurchase;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PartController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Part::with(['maintenance.motor.customer', 'supplier'])
            ->whereHas('maintenance.motor')
            ->when($request->search, function ($q, $search) {
                $q->where('part_name', 'like', "%{$search}%")
                  ->orWhereHas('maintenance.motor', fn($q) => $q
                      ->where('reference_number', 'like', "%{$search}%")
                      ->orWhereHas('customer', fn($q) => $q->where('name', 'like', "%{$search}%"))
                  );
            })
            ->when($request->type, fn($q, $t) => $q->where('type', $t))
            ->latest();

        $parts = $query->paginate(20)->withQueryString();

        $shopPurchases = SupplierPurchase::with('supplier')
            ->orderByDesc('purchase_date')
            ->orderByDesc('id')
            ->get()
            ->map(fn($p) => [
                'id'            => $p->id,
                'part_name'     => $p->part_name,
                'part_type'     => $p->part_type,
                'type_label'    => Part::typeLabel($p->part_type),
                'quantity'      => (float) $p->quantity,
                'unit_cost'     => (float) $p->unit_cost,
                'total_cost'    => (float) $p->total_cost,
                'supplier_name' => $p->supplier?->name,
                'purchase_date' => $p->purchase_date->format('Y-m-d'),
                'notes'         => $p->notes,
            ]);

        return Inertia::render('authenticated/parts', [
            'parts' => $parts->through(fn($p) => [
                'id'               => $p->id,
                'part_name'        => $p->part_name,
                'type'             => $p->type,
                'type_label'       => Part::typeLabel($p->type),
                'purchased_by'     => $p->purchased_by,
                'quantity'         => $p->quantity,
                'unit_cost'        => $p->unit_cost,
                'total_cost'       => $p->total_cost,
                'is_paid'          => $p->is_paid,
                'supplier_name'    => $p->supplier?->name,
                'motor_id'         => $p->maintenance->motor->id,
                'reference_number' => $p->maintenance->motor->reference_number,
                'customer_id'      => $p->maintenance->motor->customer->id,
                'customer_name'    => $p->maintenance->motor->customer->name,
                'stage'            => $p->maintenance->stage,
                'is_locked'        => $p->maintenance->motor->isLocked(),
            ]),
            'shop_purchases' => $shopPurchases,
            'suppliers'      => Supplier::orderBy('name')->get(['id', 'name']),
            'filters' => $request->only(['search', 'type']),
        ]);
    }

    // ── مشتريات المحل (غير مرتبطة بأي قيد استلام) ──

    public function storeShopPurchase(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'part_name'     => 'required|string|max:255',
            'supplier_id'   => 'nullable|exists:suppliers,id',
            'quantity'      => 'required|numeric|min:0.001',
            'unit_cost'     => 'required|numeric|min:0',
            'purchase_date' => 'required|date',
            'notes'         => 'nullable|string|max:500',
        ]);

        $validated['part_type']  = 'part';
        $validated['total_cost'] = $validated['quantity'] * $validated['unit_cost'];

        SupplierPurchase::create($validated);

        return back()->with('success', 'تم تسجيل المشترى');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'maintenance_id' => 'required|exists:maintenance_orders,id',
            'part_name'      => 'required|string|max:255',
            'supplier_id'    => 'nullable|exists:suppliers,id',
            'quantity'       => 'required|numeric|min:0.001',
            'unit_cost'      => 'required_if:purchased_by,company|nullable|numeric|min:0',
            'unit_price'     => 'nullable|numeric|min:0',
            'is_paid'        => 'boolean',
            'type'           => 'required|in:part,oil,transport,cleaning,other',
            'purchased_by'   => 'nullable|in:customer,company',
        ]);

        $motor = MaintenanceOrder::findOrFail($validated['maintenance_id'])->motor;

        if ($motor->isLocked()) {
            return back()->with('error', 'لا يمكن الإضافة — القيد مغلق.');
        }

        Part::create($validated);

        // If what the customer already paid still covers the new total, the new part is paid too
        if ($motor->grandTotal() > 0 && $motor->outstandingBalance() <= 0.009) {
            $motor->markPartsPaid();
        }

        return back()->with('success', 'تمت إضافة القطعة');
    }

    public function update(Request $request, Part $part): RedirectResponse
    {
        $part->load('maintenance.motor');

        if ($part->maintenance->motor->isLocked()) {
            return back()->with('error', 'لا يمكن التعديل — القيد مغلق.');
        }

        $validated = $request->validate([
            'part_name'    => 'required|string|max:255',
            'supplier_id'  => 'nullable|exists:suppliers,id',
            'quantity'     => 'required|numeric|min:0.001',
            'unit_cost'    => 'required_if:purchased_by,company|nullable|numeric|min:0',
            'unit_price'   => 'nullable|numeric|min:0',
            'is_paid'      => 'boolean',
            'type'         => 'required|in:part,oil,transport,cleaning,other',
            'purchased_by' => 'nullable|in:customer,company',
        ]);

        $part->update($validated);

        return back()->with('success', 'تم تحديث القطعة');
    }

    public function destroy(Part $part): RedirectResponse
    {
        $part->load('maintenance.motor');

        if ($part->maintenance->motor->isLocked()) {
            return back()->with('error', 'لا يمكن الحذف — القيد مغلق.');
        }

        $part->delete();

        return back()->with('success', 'تم حذف القطعة');
    }
}
