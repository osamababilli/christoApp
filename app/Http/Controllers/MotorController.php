<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\MaintenanceOrder;
use App\Models\Motor;
use App\Models\Part;
use App\Models\Supplier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MotorController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Motor::with('customer')
            ->when($request->search, function ($q, $search) {
                $q->where('reference_number', 'like', "%{$search}%")
                    ->orWhereHas('customer', fn($q) => $q
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                    )
                    ->orWhere('brand', 'like', "%{$search}%")
                    ->orWhere('model', 'like', "%{$search}%");
            })
            ->when($request->status, fn($q, $s) => $q->where('status', $s))
            ->latest();

        $motors = $query->paginate(15)->withQueryString();

        return Inertia::render('authenticated/motors', [
            'motors' => $motors->through(fn($m) => [
                'id'               => $m->id,
                'reference_number' => $m->reference_number,
                'customer_id'      => $m->customer->id,
                'customer_name'    => $m->customer->name,
                'customer_phone'   => $m->customer->phone,
                'brand'            => $m->brand,
                'model'            => $m->model,
                'status'           => $m->status,
                'status_label'     => Motor::statusLabel($m->status),
                'condition_rating' => $m->condition_rating,
                'condition_label'  => $m->condition_rating ? Motor::conditionLabel($m->condition_rating) : null,
                'received_at'      => $m->received_at?->format('Y-m-d'),
                'delivered_at'     => $m->delivered_at?->format('Y-m-d'),
            ]),
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    private function customersList(): array
    {
        return Customer::orderBy('name')
            ->get(['id', 'name', 'phone'])
            ->map(fn($c) => [
                'id'    => $c->id,
                'name'  => $c->name,
                'phone' => $c->phone,
                'label' => "{$c->name} — {$c->phone}",
            ])
            ->toArray();
    }

    public function create(): Response
    {
        return Inertia::render('authenticated/motors/create', [
            'customers' => $this->customersList(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'customer_id'      => 'nullable|exists:customers,id',
            'customer_name'    => 'required_without:customer_id|nullable|string|max:255',
            'customer_phone'   => 'required_without:customer_id|nullable|string|max:50',
            'brand'            => 'nullable|string|max:100',
            'model'            => 'nullable|string|max:100',
            'status'           => 'required|in:in_workshop,in_progress,ready,delivered',
            'condition_rating' => 'nullable|in:excellent,good,fair,poor',
            'notes'            => 'nullable|string',
        ]);

        if (! empty($validated['customer_id'])) {
            $customer = Customer::findOrFail($validated['customer_id']);
        } else {
            $customer = Customer::firstOrCreate(
                ['phone' => $validated['customer_phone']],
                ['name'  => $validated['customer_name']]
            );
            $customer->update(['name' => $validated['customer_name']]);
        }

        Motor::create([
            'customer_id'      => $customer->id,
            'brand'            => $validated['brand'] ?? null,
            'model'            => $validated['model'] ?? null,
            'status'           => $validated['status'],
            'condition_rating' => $validated['condition_rating'] ?? null,
            'notes'            => $validated['notes'] ?? null,
            'received_at'      => $validated['received_at'] ?? now(),
        ]);

        return redirect()->route('motors.index')
            ->with('success', 'تم تسجيل الموتور بنجاح');
    }

    public function show(Motor $motor): Response
    {
        $motor->load([
            'customer',
            'maintenanceOrders.parts.supplier',
            'transactions',
        ]);

        $suppliers = Supplier::orderBy('name')->get(['id', 'name'])
            ->map(fn($s) => ['id' => $s->id, 'name' => $s->name])
            ->toArray();

        return Inertia::render('authenticated/motors/show', [
            'suppliers' => $suppliers,
            'motor' => [
                'id'               => $motor->id,
                'reference_number' => $motor->reference_number,
                'customer'         => [
                    'id'    => $motor->customer->id,
                    'name'  => $motor->customer->name,
                    'phone' => $motor->customer->phone,
                ],
                'brand'            => $motor->brand,
                'model'            => $motor->model,
                'status'           => $motor->status,
                'status_label'     => Motor::statusLabel($motor->status),
                'condition_rating' => $motor->condition_rating,
                'condition_label'  => $motor->condition_rating ? Motor::conditionLabel($motor->condition_rating) : null,
                'notes'            => $motor->notes,
                'received_at'      => $motor->received_at?->format('Y-m-d H:i'),
                'delivered_at'     => $motor->delivered_at?->format('Y-m-d H:i'),
                'transactions' => $motor->transactions->sortByDesc('transaction_date')->values()->map(fn($t) => [
                    'id'               => $t->id,
                    'type'             => $t->type,
                    'type_label'       => $t->type === 'payment' ? 'دفعة' : 'خصم',
                    'amount'           => (float) $t->amount,
                    'notes'            => $t->notes,
                    'transaction_date' => $t->transaction_date->format('Y-m-d'),
                ]),
                'maintenance_orders' => $motor->maintenanceOrders->map(fn($o) => [
                    'id'           => $o->id,
                    'stage'        => $o->stage,
                    'description'  => $o->description,
                    'started_at'   => $o->started_at?->format('Y-m-d'),
                    'completed_at' => $o->completed_at?->format('Y-m-d'),
                    'labor_cost'   => $o->labor_cost,
                    'status'       => $o->status,
                    'status_label' => MaintenanceOrder::statusLabel($o->status),
                    'stop_reason'  => $o->stop_reason,
                    'parts'        => $o->parts->map(fn($p) => [
                        'id'            => $p->id,
                        'part_name'     => $p->part_name,
                        'type'          => $p->type,
                        'type_label'    => Part::typeLabel($p->type),
                        'quantity'      => $p->quantity,
                        'unit_cost'     => $p->unit_cost,
                        'total_cost'    => $p->total_cost,
                        'is_paid'       => $p->is_paid,
                        'supplier_name' => $p->supplier?->name,
                    ]),
                ]),
            ],
        ]);
    }

    public function printView(Motor $motor): Response
    {
        $motor->load([
            'customer',
            'maintenanceOrders.parts.supplier',
            'transactions',
        ]);

        return Inertia::render('print/motor', [
            'motor' => [
                'id'               => $motor->id,
                'reference_number' => $motor->reference_number,
                'customer'         => [
                    'name'  => $motor->customer->name,
                    'phone' => $motor->customer->phone,
                ],
                'brand'            => $motor->brand,
                'model'            => $motor->model,
                'status_label'     => Motor::statusLabel($motor->status),
                'condition_label'  => $motor->condition_rating ? Motor::conditionLabel($motor->condition_rating) : null,
                'notes'            => $motor->notes,
                'received_at'      => $motor->received_at?->format('Y-m-d'),
                'delivered_at'     => $motor->delivered_at?->format('Y-m-d'),
                'maintenance_orders' => $motor->maintenanceOrders->map(fn($o) => [
                    'id'           => $o->id,
                    'stage'        => $o->stage,
                    'description'  => $o->description,
                    'started_at'   => $o->started_at?->format('Y-m-d'),
                    'completed_at' => $o->completed_at?->format('Y-m-d'),
                    'labor_cost'   => (float) $o->labor_cost,
                    'status_label' => MaintenanceOrder::statusLabel($o->status),
                    'parts'        => $o->parts->map(fn($p) => [
                        'part_name'  => $p->part_name,
                        'type_label' => Part::typeLabel($p->type),
                        'quantity'   => (float) $p->quantity,
                        'unit_cost'  => (float) $p->unit_cost,
                        'total_cost' => (float) $p->total_cost,
                        'supplier_name' => $p->supplier?->name,
                    ]),
                ]),
                'transactions' => $motor->transactions->sortByDesc('transaction_date')->values()->map(fn($t) => [
                    'type_label'       => $t->type === 'payment' ? 'دفعة' : 'خصم',
                    'amount'           => (float) $t->amount,
                    'notes'            => $t->notes,
                    'transaction_date' => $t->transaction_date->format('Y-m-d'),
                ]),
            ],
        ]);
    }

    public function printDelivery(Motor $motor): Response
    {
        $motor->load(['customer', 'maintenanceOrders.parts', 'transactions']);

        $labor      = $motor->maintenanceOrders->sum('labor_cost');
        $parts      = $motor->maintenanceOrders->flatMap(fn($o) => $o->parts)->sum('total_cost');
        $grandTotal = $labor + $parts;
        $paid       = $motor->transactions->sum('amount');

        return Inertia::render('print/delivery', [
            'motor' => [
                'id'               => $motor->id,
                'reference_number' => $motor->reference_number,
                'customer'         => [
                    'name'  => $motor->customer->name,
                    'phone' => $motor->customer->phone,
                ],
                'brand'            => $motor->brand,
                'model'            => $motor->model,
                'status_label'     => Motor::statusLabel($motor->status),
                'condition_label'  => $motor->condition_rating ? Motor::conditionLabel($motor->condition_rating) : null,
                'notes'            => $motor->notes,
                'received_at'      => $motor->received_at?->format('Y-m-d'),
                'delivered_at'     => $motor->delivered_at?->format('Y-m-d'),
                'maintenance_summary' => $motor->maintenanceOrders->map(fn($o) => [
                    'stage'       => $o->stage,
                    'description' => $o->description,
                    'status_label' => MaintenanceOrder::statusLabel($o->status),
                ]),
                'grand_total'  => (float) $grandTotal,
                'total_paid'   => (float) $paid,
                'remaining'    => (float) ($grandTotal - $paid),
            ],
        ]);
    }

    private function isLocked(Motor $motor): bool
    {
        $motor->loadMissing(['maintenanceOrders.parts', 'transactions']);
        $grandTotal = $motor->maintenanceOrders->sum('labor_cost')
            + $motor->maintenanceOrders->flatMap(fn($o) => $o->parts)->sum('total_cost');
        $paid = $motor->transactions->sum('amount');
        return $motor->status === 'delivered' && ($grandTotal - $paid) <= 0.009;
    }

    public function edit(Motor $motor): Response
    {
        if ($this->isLocked($motor)) {
            return redirect()->route('motors.show', $motor)
                ->with('error', 'لا يمكن تعديل موتور مسلَّم ومسدَّد بالكامل.');
        }

        $motor->load('customer');

        return Inertia::render('authenticated/motors/edit', [
            'customers' => $this->customersList(),
            'motor' => [
                'id'               => $motor->id,
                'reference_number' => $motor->reference_number,
                'customer_id'      => $motor->customer->id,
                'customer_name'    => $motor->customer->name,
                'customer_phone'   => $motor->customer->phone,
                'brand'            => $motor->brand,
                'model'            => $motor->model,
                'status'           => $motor->status,
                'condition_rating' => $motor->condition_rating,
                'notes'            => $motor->notes,
                'received_at'      => $motor->received_at?->format('Y-m-d'),
                'delivered_at'     => $motor->delivered_at?->format('Y-m-d'),
            ],
        ]);
    }

    public function update(Request $request, Motor $motor): RedirectResponse
    {
        if ($this->isLocked($motor)) {
            return redirect()->route('motors.show', $motor)
                ->with('error', 'لا يمكن تعديل موتور مسلَّم ومسدَّد بالكامل.');
        }

        $validated = $request->validate([
            'customer_id'      => 'nullable|exists:customers,id',
            'customer_name'    => 'required_without:customer_id|nullable|string|max:255',
            'customer_phone'   => 'required_without:customer_id|nullable|string|max:50',
            'brand'            => 'nullable|string|max:100',
            'model'            => 'nullable|string|max:100',
            'status'           => 'required|in:in_workshop,in_progress,ready,delivered',
            'condition_rating' => 'nullable|in:excellent,good,fair,poor',
            'notes'            => 'nullable|string',
            'delivered_at'     => 'nullable|date',
        ]);

        if (! empty($validated['customer_id'])) {
            $motor->update(['customer_id' => $validated['customer_id']]);
        } else {
            $motor->customer->update([
                'name'  => $validated['customer_name'],
                'phone' => $validated['customer_phone'],
            ]);
        }

        $motor->update([
            'brand'            => $validated['brand'] ?? null,
            'model'            => $validated['model'] ?? null,
            'status'           => $validated['status'],
            'condition_rating' => $validated['condition_rating'] ?? null,
            'notes'            => $validated['notes'] ?? null,
            'received_at'      => $validated['received_at'] ?? $motor->received_at,
            'delivered_at'     => $validated['delivered_at'] ?? null,
        ]);

        return redirect()->route('motors.show', $motor)
            ->with('success', 'تم تحديث بيانات الموتور');
    }

    public function destroy(Motor $motor): RedirectResponse
    {
        $motor->delete();

        return redirect()->route('motors.index')
            ->with('success', 'تم أرشفة الموتور');
    }

    public function bulkDestroy(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids'   => 'required|array|min:1',
            'ids.*' => 'integer|exists:motors,id',
        ]);

        Motor::whereIn('id', $validated['ids'])->each(fn($m) => $m->delete());

        $count = count($validated['ids']);

        return back()->with('success', "تم أرشفة {$count} موتور بنجاح");
    }

    public function updateStatus(Request $request, Motor $motor): RedirectResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:in_workshop,in_progress,ready,delivered',
        ]);

        if ($validated['status'] === 'delivered') {
            $motor->update(['status' => 'delivered', 'delivered_at' => now()]);
        } else {
            $motor->update(['status' => $validated['status']]);
        }

        return back()->with('success', 'تم تحديث الحالة');
    }
}
