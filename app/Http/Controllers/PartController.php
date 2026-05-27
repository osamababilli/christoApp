<?php

namespace App\Http\Controllers;

use App\Models\Part;
use App\Models\Supplier;
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

        return Inertia::render('authenticated/parts', [
            'parts' => $parts->through(fn($p) => [
                'id'             => $p->id,
                'part_name'      => $p->part_name,
                'type'           => $p->type,
                'type_label'     => Part::typeLabel($p->type),
                'quantity'       => $p->quantity,
                'unit_cost'      => $p->unit_cost,
                'total_cost'     => $p->total_cost,
                'is_paid'        => $p->is_paid,
                'supplier_name'  => $p->supplier?->name,
                'motor_id'       => $p->maintenance->motor->id,
                'reference_number' => $p->maintenance->motor->reference_number,
                'customer_id'    => $p->maintenance->motor->customer->id,
                'customer_name'  => $p->maintenance->motor->customer->name,
                'stage'          => $p->maintenance->stage,
            ]),
            'filters' => $request->only(['search', 'type']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'maintenance_id' => 'required|exists:maintenance_orders,id',
            'part_name'      => 'required|string|max:255',
            'supplier_id'    => 'nullable|exists:suppliers,id',
            'quantity'       => 'required|numeric|min:0.001',
            'unit_cost'      => 'required|numeric|min:0',
            'is_paid'        => 'boolean',
            'type'           => 'required|in:part,oil,transport,cleaning,other',
        ]);

        Part::create($validated);

        return back()->with('success', 'تمت إضافة القطعة');
    }

    public function update(Request $request, Part $part): RedirectResponse
    {
        $validated = $request->validate([
            'part_name'   => 'required|string|max:255',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'quantity'    => 'required|numeric|min:0.001',
            'unit_cost'   => 'required|numeric|min:0',
            'is_paid'     => 'boolean',
            'type'        => 'required|in:part,oil,transport,cleaning,other',
        ]);

        $part->update($validated);

        return back()->with('success', 'تم تحديث القطعة');
    }

    public function destroy(Part $part): RedirectResponse
    {
        $part->delete();

        return back()->with('success', 'تم حذف القطعة');
    }
}
