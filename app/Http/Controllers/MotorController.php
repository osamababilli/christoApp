<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Customer;
use App\Models\Employee;
use App\Models\MaintenanceOrder;
use App\Models\Motor;
use App\Models\Part;
use App\Models\Supplier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class MotorController extends Controller
{
    public function index(Request $request): Response
    {
        $archived = (bool) $request->boolean('archived');

        $query = Motor::with(['customer', 'category', 'receivedByEmployee'])
            ->when($archived, fn($q) => $q->onlyTrashed())
            ->when($request->search, function ($q, $search) {
                $q->where('reference_number', 'like', "%{$search}%")
                    ->orWhereHas('customer', fn($q) => $q
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                    );
            })
            ->when(! $archived && $request->status, fn($q, $s) => $q->where('status', $s))
            ->latest();

        $perPage = in_array((int) $request->per_page, [10, 15, 25, 50, 100]) ? (int) $request->per_page : 15;
        $motors  = $query->paginate($perPage)->withQueryString();

        return Inertia::render('authenticated/motors', [
            'motors' => $motors->through(fn($m) => [
                'id'               => $m->id,
                'reference_number' => $m->reference_number,
                'customer_id'      => $m->customer->id,
                'customer_name'    => $m->customer->name,
                'customer_phone'   => $m->customer->phone,
                'status'           => $m->status,
                'status_label'     => Motor::statusLabel($m->status),
                'received_at'      => $m->received_at?->format('Y-m-d'),
                'delivered_at'     => $m->delivered_at?->format('Y-m-d'),
                'category_id'      => $m->category_id,
                'category_name'    => $m->category?->name ?? null,
                'received_by_name' => $m->receivedByEmployee?->full_name ?? null,
                'deleted_at'       => $m->deleted_at?->format('Y-m-d'),
            ]),
            'filters'  => $request->only(['search', 'status', 'archived', 'per_page']),
            'per_page' => $perPage,
        ]);
    }

    public function restore(int $id): RedirectResponse
    {
        $motor = Motor::onlyTrashed()->findOrFail($id);
        $motor->restore();

        return back()->with('success', 'تم استعادة القيد بنجاح');
    }

    private function employeesList(): array
    {
        return Employee::orderBy('full_name')
            ->get(['id', 'full_name'])
            ->map(fn($e) => ['id' => $e->id, 'full_name' => $e->full_name])
            ->toArray();
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
            'customers'  => $this->customersList(),
            'categories' => Category::orderBy('name')->get(['id', 'name', 'color', 'icon']),
            'employees'  => $this->employeesList(),
            'suppliers'  => Supplier::orderBy('name')->get(['id', 'name'])
                ->map(fn($s) => ['id' => $s->id, 'name' => $s->name])
                ->toArray(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'customer_id'        => 'nullable|exists:customers,id',
            'customer_name'      => 'required_without:customer_id|nullable|string|max:255',
            'customer_phone'     => 'required_without:customer_id|nullable|string|max:50',
            'category_id'        => 'nullable|exists:categories,id',
            'notes'              => 'nullable|string',
            'received_by'          => 'required|exists:employees,id',
            'description'          => 'required|string',
            'labor_cost'           => 'nullable|numeric|min:0',
            'parts'                => 'array',
            'parts.*.part_name'    => 'required|string|max:255',
            'parts.*.quantity'     => 'required|numeric|min:0.001',
            'parts.*.type'         => 'nullable|in:part,oil,transport,cleaning,other',
            'parts.*.purchased_by' => 'nullable|in:customer,company',
            'parts.*.unit_cost'    => 'nullable|numeric|min:0',
            'parts.*.unit_price'   => 'nullable|numeric|min:0',
            'parts.*.supplier_id'  => 'nullable|exists:suppliers,id',
            'parts.*.is_paid'      => 'boolean',
        ]);

        $motor = DB::transaction(function () use ($validated) {
            if (! empty($validated['customer_id'])) {
                $customer = Customer::findOrFail($validated['customer_id']);
            } else {
                $customer = Customer::firstOrCreate(
                    ['phone' => $validated['customer_phone']],
                    ['name'  => $validated['customer_name']]
                );
                $customer->update(['name' => $validated['customer_name']]);
            }

            $motor = Motor::create([
                'customer_id' => $customer->id,
                'category_id' => $validated['category_id'] ?? null,
                'status'      => 'in_workshop',
                'notes'       => $validated['notes'] ?? null,
                'received_at' => now(),
                'received_by' => $validated['received_by'] ?? null,
            ]);

            $order = MaintenanceOrder::create([
                'motor_id'    => $motor->id,
                'stage'       => 1,
                'description' => $validated['description'],
                'status'      => 'in_progress',
                'started_at'  => now(),
                'labor_cost'  => $validated['labor_cost'] ?? 0,
            ]);

            foreach ($validated['parts'] ?? [] as $part) {
                Part::create([
                    'maintenance_id' => $order->id,
                    'part_name'      => $part['part_name'],
                    'quantity'       => $part['quantity'],
                    'type'           => $part['type'] ?? 'part',
                    'purchased_by'   => $part['purchased_by'] ?? 'customer',
                    'unit_cost'      => $part['unit_cost'] ?? null,
                    'unit_price'     => $part['unit_price'] ?? null,
                    'supplier_id'    => $part['supplier_id'] ?? null,
                    'is_paid'        => $part['is_paid'] ?? false,
                ]);
            }

            return $motor;
        });

        return redirect()->route('motors.show', $motor)
            ->with('success', 'تم تسجيل قيد الاستلام بنجاح');
    }

    public function show(Motor $motor): Response
    {
        $motor->load([
            'customer',
            'category',
            'assignedToUser',
            'receivedByEmployee',
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
                    'id'           => $motor->customer->id,
                    'name'         => $motor->customer->name,
                    'phone'        => $motor->customer->phone,
                    'account_type' => $motor->customer->account_type ?? 'direct',
                ],
                'status'           => $motor->status,
                'status_label'     => Motor::statusLabel($motor->status),
                'notes'            => $motor->notes,
                'received_at'      => $motor->received_at?->format('Y-m-d H:i'),
                'delivered_at'     => $motor->delivered_at?->format('Y-m-d H:i'),
                'category_id'               => $motor->category_id,
                'category_name'             => $motor->category?->name ?? null,
                'assigned_to'               => $motor->assigned_to,
                'assigned_to_name'          => $motor->assignedToUser?->name ?? null,
                'received_by'               => $motor->received_by,
                'received_by_name'          => $motor->receivedByEmployee?->full_name ?? null,
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
                        'unit_price'    => $p->unit_price,
                        'total_cost'    => $p->total_cost,
                        'is_paid'       => $p->is_paid,
                        'purchased_by'  => $p->purchased_by ?? 'customer',
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
                'status_label'     => Motor::statusLabel($motor->status),
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
                        'part_name'    => $p->part_name,
                        'type_label'   => Part::typeLabel($p->type),
                        'quantity'     => (float) $p->quantity,
                        // سعر الوحدة للعميل: سعر البيع إذا اشترتها الشركة، وإلا سعر التكلفة
                        'unit_cost'    => $p->purchased_by === 'company' ? (float) $p->unit_price : (float) $p->unit_cost,
                        'total_cost'   => (float) $p->total_cost,
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

    public function printQuotation(Motor $motor): Response
    {
        $motor->load([
            'customer',
            'category',
            'maintenanceOrders.parts',
        ]);

        return Inertia::render('print/quotation', [
            'motor' => [
                'id'               => $motor->id,
                'reference_number' => $motor->reference_number,
                'customer'         => [
                    'name'  => $motor->customer->name,
                    'phone' => $motor->customer->phone,
                ],
                'notes'            => $motor->notes,
                'received_at'      => $motor->received_at?->format('Y-m-d'),
                'category_name'    => $motor->category?->name ?? null,
                'maintenance_orders' => $motor->maintenanceOrders->map(fn($o) => [
                    'stage'       => $o->stage,
                    'description' => $o->description,
                    'labor_cost'  => (float) $o->labor_cost,
                    'status_label' => MaintenanceOrder::statusLabel($o->status),
                    'parts'       => $o->parts->map(fn($p) => [
                        'part_name'   => $p->part_name,
                        'type_label'  => Part::typeLabel($p->type),
                        'quantity'    => (float) $p->quantity,
                        'unit_price'  => $p->purchased_by === 'company' ? (float) $p->unit_price : (float) $p->unit_cost,
                        'total_price' => (float) $p->total_cost,
                    ]),
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
                'status_label'     => Motor::statusLabel($motor->status),
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

    public function edit(Motor $motor): Response|RedirectResponse
    {
        if ($this->isLocked($motor)) {
            return redirect()->route('motors.show', $motor)
                ->with('error', 'لا يمكن تعديل قيد استلام مسلَّم ومسدَّد بالكامل.');
        }

        $motor->load('customer');

        return Inertia::render('authenticated/motors/edit', [
            'customers'  => $this->customersList(),
            'categories' => Category::orderBy('name')->get(['id', 'name', 'color', 'icon']),
            'employees'  => $this->employeesList(),
            'motor' => [
                'id'                => $motor->id,
                'reference_number'  => $motor->reference_number,
                'customer_id'       => $motor->customer->id,
                'customer_name'     => $motor->customer->name,
                'customer_phone'    => $motor->customer->phone,
                'category_id'       => $motor->category_id,
                'status'            => $motor->status,
                'notes'             => $motor->notes,
                'received_at'       => $motor->received_at?->format('Y-m-d'),
                'delivered_at'      => $motor->delivered_at?->format('Y-m-d'),
                'assigned_to'       => $motor->assigned_to,
                'received_by'       => $motor->received_by,
            ],
        ]);
    }

    public function update(Request $request, Motor $motor): RedirectResponse
    {
        if ($this->isLocked($motor)) {
            return redirect()->route('motors.show', $motor)
                ->with('error', 'لا يمكن تعديل قيد استلام مسلَّم ومسدَّد بالكامل.');
        }

        $validated = $request->validate([
            'customer_id'       => 'nullable|exists:customers,id',
            'customer_name'     => 'required_without:customer_id|nullable|string|max:255',
            'customer_phone'    => 'required_without:customer_id|nullable|string|max:50',
            'category_id'       => 'nullable|exists:categories,id',
            'status'            => 'required|in:in_workshop,in_progress,ready,delivered',
            'notes'             => 'nullable|string',
            'delivered_at'      => 'nullable|date',
            'assigned_to'       => 'nullable|exists:users,id',
            'received_by'       => 'nullable|exists:employees,id',
        ]);

        if (! empty($validated['customer_id'])) {
            $motor->update(['customer_id' => $validated['customer_id']]);
        } else {
            $customer = Customer::firstOrCreate(
                ['phone' => $validated['customer_phone']],
                ['name'  => $validated['customer_name']]
            );
            $motor->update(['customer_id' => $customer->id]);
        }

        $motor->update([
            'category_id'       => $validated['category_id'] ?? null,
            'status'            => $validated['status'],
            'notes'             => $validated['notes'] ?? null,
            'received_at'       => $validated['received_at'] ?? $motor->received_at,
            'delivered_at'      => $validated['delivered_at'] ?? null,
            'assigned_to'       => $validated['assigned_to'] ?? null,
            'received_by'       => $validated['received_by'] ?? null,
        ]);

        return redirect()->route('motors.show', $motor)
            ->with('success', 'تم تحديث البيانات');
    }

    public function destroy(Motor $motor): RedirectResponse
    {
        $motor->delete();

        return redirect()->route('motors.index')
            ->with('success', 'تم الأرشفة');
    }

    public function bulkDestroy(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids'   => 'required|array|min:1',
            'ids.*' => 'integer|exists:motors,id',
        ]);

        Motor::whereIn('id', $validated['ids'])->each(fn($m) => $m->delete());

        $count = count($validated['ids']);

        return back()->with('success', "تم أرشفة {$count} قيد استلام بنجاح");
    }

    public function updateStatus(Request $request, Motor $motor): RedirectResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:in_workshop,in_progress,ready,delivered',
        ]);

        if ($validated['status'] === 'delivered') {
            $motor->update(['status' => 'delivered', 'delivered_at' => now()]);

            $motor->maintenanceOrders()
                ->where('status', '!=', 'completed')
                ->update(['status' => 'completed', 'completed_at' => now()]);
        } else {
            $motor->update(['status' => $validated['status']]);
        }

        return back()->with('success', 'تم تحديث الحالة');
    }
}
