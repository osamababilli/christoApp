<?php

namespace App\Http\Controllers;

use App\Models\Part;
use App\Models\Supplier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
                ->orWhere('email', 'like', "%{$s}%")
            )
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('authenticated/suppliers', [
            'suppliers' => $suppliers->through(fn($s) => [
                'id'          => $s->id,
                'name'        => $s->name,
                'phone'       => $s->phone,
                'email'       => $s->email,
                'notes'       => $s->notes,
                'parts_count' => $s->parts_count,
                'created_at'  => $s->created_at->format('Y-m-d'),
            ]),
            'filters' => $request->only(['search']),
        ]);
    }

    public function show(Supplier $supplier): Response
    {
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

        return Inertia::render('authenticated/suppliers/show', [
            'supplier' => [
                'id'          => $supplier->id,
                'name'        => $supplier->name,
                'phone'       => $supplier->phone,
                'email'       => $supplier->email,
                'notes'       => $supplier->notes,
                'created_at'  => $supplier->created_at->format('Y-m-d'),
            ],
            'parts'   => $parts,
            'summary' => [
                'total_parts'  => $parts->count(),
                'total_cost'   => (float) $parts->sum('total_cost'),
                'paid_cost'    => (float) $parts->where('is_paid', true)->sum('total_cost'),
                'unpaid_cost'  => (float) $parts->where('is_paid', false)->sum('total_cost'),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'  => 'required|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'notes' => 'nullable|string|max:1000',
        ]);

        Supplier::create($validated);

        return back()->with('success', 'تم إضافة المورد بنجاح');
    }

    public function update(Request $request, Supplier $supplier): RedirectResponse
    {
        $validated = $request->validate([
            'name'  => 'required|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'notes' => 'nullable|string|max:1000',
        ]);

        $supplier->update($validated);

        return back()->with('success', 'تم تحديث بيانات المورد');
    }

    public function destroy(Supplier $supplier): RedirectResponse
    {
        $supplier->delete();

        return back()->with('success', 'تم حذف المورد');
    }
}
