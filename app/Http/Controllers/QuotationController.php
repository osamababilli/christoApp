<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Employee;
use App\Models\MaintenanceOrder;
use App\Models\Motor;
use App\Models\Quotation;
use App\Models\QuotationItem;
use App\Models\ReceivedItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class QuotationController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Quotation::query()
            ->when($request->search, function ($q, $search) {
                $q->where('reference_number', 'like', "%{$search}%")
                    ->orWhere('customer_name', 'like', "%{$search}%")
                    ->orWhere('customer_phone', 'like', "%{$search}%");
            })
            ->when($request->status, fn($q, $s) => $q->where('status', $s))
            ->latest();

        $quotations = $query->paginate(15)->withQueryString();

        return Inertia::render('authenticated/quotations', [
            'quotations' => $quotations->through(fn($q) => [
                'id'               => $q->id,
                'reference_number' => $q->reference_number,
                'customer_name'    => $q->customer_name,
                'customer_phone'   => $q->customer_phone,
                'status'           => $q->status,
                'status_label'     => Quotation::statusLabel($q->status),
                'valid_days'       => $q->valid_days,
                'created_at'       => $q->created_at->format('Y-m-d'),
            ]),
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('authenticated/quotations/create', [
            'customers' => $this->customersList(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'customer_id'              => 'nullable|exists:customers,id',
            'customer_name'            => 'required_without:customer_id|nullable|string|max:255',
            'customer_phone'           => 'required_without:customer_id|nullable|string|max:50',
            'notes'                    => 'nullable|string',
            'valid_days'               => 'integer|min:1|max:255',
            'services'                 => 'array',
            'services.*.description'   => 'required|string|max:500',
            'services.*.labor_cost'    => 'required|numeric|min:0',
            'parts'                    => 'array',
            'parts.*.description'      => 'required|string|max:255',
            'parts.*.part_type'        => 'nullable|in:part,oil,transport,cleaning,other',
            'parts.*.quantity'         => 'required|numeric|min:0.001',
            'parts.*.unit_price'       => 'required|numeric|min:0',
        ]);

        $customerData = $this->resolveCustomer($validated);

        $quotation = Quotation::create([
            'customer_id'    => $customerData['id'],
            'customer_name'  => $customerData['name'],
            'customer_phone' => $customerData['phone'],
            'status'         => in_array($request->input('status'), ['draft', 'sent']) ? $request->input('status') : 'draft',
            'notes'          => $validated['notes'] ?? null,
            'valid_days'     => $validated['valid_days'] ?? 15,
        ]);

        $this->syncItems($quotation, $validated);

        return redirect()->route('quotations.show', $quotation)
            ->with('success', 'تم إنشاء عرض السعر بنجاح');
    }

    public function show(Quotation $quotation): Response
    {
        $quotation->load('items', 'convertedToMotor');

        $services = $quotation->items->where('type', 'service')->values();
        $parts    = $quotation->items->where('type', 'part')->values();

        return Inertia::render('authenticated/quotations/show', [
            'quotation' => $this->formatQuotation($quotation, $services, $parts),
            'employees'  => $this->employeesList(),
        ]);
    }

    public function edit(Quotation $quotation): Response
    {
        $quotation->load('items');

        $services = $quotation->items->where('type', 'service')->values()->map(fn($i) => [
            'description' => $i->description,
            'labor_cost'  => (string) $i->unit_price,
        ])->toArray();

        $parts = $quotation->items->where('type', 'part')->values()->map(fn($i) => [
            'description' => $i->description,
            'part_type'   => $i->part_type ?? '',
            'quantity'    => (string) $i->quantity,
            'unit_price'  => (string) $i->unit_price,
        ])->toArray();

        return Inertia::render('authenticated/quotations/edit', [
            'customers' => $this->customersList(),
            'quotation' => [
                'id'             => $quotation->id,
                'customer_id'    => $quotation->customer_id,
                'customer_name'  => $quotation->customer_name,
                'customer_phone' => $quotation->customer_phone,
                'notes'          => $quotation->notes,
                'valid_days'     => $quotation->valid_days,
                'services'       => $services,
                'parts'          => $parts,
            ],
        ]);
    }

    public function update(Request $request, Quotation $quotation): RedirectResponse
    {
        $validated = $request->validate([
            'customer_id'              => 'nullable|exists:customers,id',
            'customer_name'            => 'required_without:customer_id|nullable|string|max:255',
            'customer_phone'           => 'required_without:customer_id|nullable|string|max:50',
            'notes'                    => 'nullable|string',
            'valid_days'               => 'integer|min:1|max:255',
            'services'                 => 'array',
            'services.*.description'   => 'required|string|max:500',
            'services.*.labor_cost'    => 'required|numeric|min:0',
            'parts'                    => 'array',
            'parts.*.description'      => 'required|string|max:255',
            'parts.*.part_type'        => 'nullable|in:part,oil,transport,cleaning,other',
            'parts.*.quantity'         => 'required|numeric|min:0.001',
            'parts.*.unit_price'       => 'required|numeric|min:0',
        ]);

        $customerData = $this->resolveCustomer($validated);

        $quotation->update([
            'customer_id'    => $customerData['id'],
            'customer_name'  => $customerData['name'],
            'customer_phone' => $customerData['phone'],
            'notes'          => $validated['notes'] ?? null,
            'valid_days'     => $validated['valid_days'] ?? 15,
        ]);

        $quotation->items()->delete();
        $this->syncItems($quotation, $validated);

        return redirect()->route('quotations.show', $quotation)
            ->with('success', 'تم تحديث عرض السعر');
    }

    public function destroy(Quotation $quotation): RedirectResponse
    {
        $quotation->delete();

        return redirect()->route('quotations.index')
            ->with('success', 'تم حذف عرض السعر');
    }

    public function updateStatus(Request $request, Quotation $quotation): RedirectResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:draft,sent,accepted,rejected,converted',
        ]);

        $allowedTransitions = [
            'draft'    => ['sent'],
            'sent'     => ['accepted', 'rejected'],
            'accepted' => ['converted'],
        ];

        $allowed = $allowedTransitions[$quotation->status] ?? [];

        if (! in_array($validated['status'], $allowed)) {
            return back()->with('error', 'لا يمكن تغيير الحالة إلى هذه القيمة');
        }

        $quotation->update(['status' => $validated['status']]);

        return back()->with('success', 'تم تحديث حالة عرض السعر');
    }

    public function print(Quotation $quotation): Response
    {
        $quotation->load('items');

        $services = $quotation->items->where('type', 'service')->values();
        $parts    = $quotation->items->where('type', 'part')->values();

        return Inertia::render('print/quotation', [
            'quotation' => [
                'id'               => $quotation->id,
                'reference_number' => $quotation->reference_number,
                'customer'         => [
                    'name'  => $quotation->customer_name,
                    'phone' => $quotation->customer_phone,
                ],
                'notes'      => $quotation->notes,
                'valid_days' => $quotation->valid_days,
                'created_at' => $quotation->created_at->format('Y-m-d'),
                'services'   => $services->map(fn($i) => [
                    'description' => $i->description,
                    'labor_cost'  => (float) $i->unit_price,
                ])->toArray(),
                'parts' => $parts->map(fn($i) => [
                    'description'     => $i->description,
                    'part_type_label' => $i->part_type ? QuotationItem::partTypeLabel($i->part_type) : '',
                    'quantity'        => (float) $i->quantity,
                    'unit_price'      => (float) $i->unit_price,
                    'total_price'     => (float) $i->total_price,
                ])->toArray(),
            ],
        ]);
    }

    public function convert(Request $request, Quotation $quotation): RedirectResponse
    {
        $validated = $request->validate([
            'notes'                       => 'nullable|string',
            'received_by'                 => 'nullable|exists:employees,id',
            'received_items'              => 'array',
            'received_items.*.item_name'  => 'required|string|max:255',
            'received_items.*.quantity'   => 'required|integer|min:1',
        ]);

        return DB::transaction(function () use ($validated, $quotation) {
            $locked = Quotation::where('id', $quotation->id)
                ->where('status', 'accepted')
                ->lockForUpdate()
                ->first();

            if (! $locked) {
                return back()->with('error', 'يمكن تحويل العروض المقبولة فقط');
            }

            if (! empty($locked->customer_id)) {
                $customer = Customer::findOrFail($locked->customer_id);
            } else {
                $customer = Customer::firstOrCreate(
                    ['phone' => $locked->customer_phone],
                    ['name'  => $locked->customer_name]
                );
            }

            $motor = Motor::create([
                'customer_id' => $customer->id,
                'status'      => 'in_workshop',
                'notes'       => $validated['notes'] ?? $locked->notes,
                'received_at' => now(),
                'received_by' => $validated['received_by'] ?? null,
            ]);

            foreach ($validated['received_items'] ?? [] as $item) {
                ReceivedItem::create([
                    'motor_id'  => $motor->id,
                    'item_name' => $item['item_name'],
                    'quantity'  => $item['quantity'],
                ]);
            }

            $locked->load('items');
            $serviceItems = $locked->items->where('type', 'service')->values();

            $stage = 1;
            foreach ($serviceItems as $item) {
                MaintenanceOrder::create([
                    'motor_id'    => $motor->id,
                    'stage'       => $stage++,
                    'description' => $item->description,
                    'labor_cost'  => $item->unit_price,
                    'status'      => 'in_progress',
                    'started_at'  => now(),
                ]);
            }

            $locked->update([
                'status'                => 'converted',
                'converted_to_motor_id' => $motor->id,
            ]);

            return redirect()->route('motors.show', $motor)
                ->with('success', 'تم تحويل عرض السعر إلى قيد استلام بنجاح');
        });
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

    private function employeesList(): array
    {
        return Employee::orderBy('full_name')
            ->get(['id', 'full_name'])
            ->map(fn($e) => ['id' => $e->id, 'full_name' => $e->full_name])
            ->toArray();
    }

    private function resolveCustomer(array $validated): array
    {
        if (! empty($validated['customer_id'])) {
            $customer = Customer::findOrFail($validated['customer_id']);
            return ['id' => $customer->id, 'name' => $customer->name, 'phone' => $customer->phone];
        }

        return [
            'id'    => null,
            'name'  => $validated['customer_name'] ?? '',
            'phone' => $validated['customer_phone'] ?? '',
        ];
    }

    private function syncItems(Quotation $quotation, array $validated): void
    {
        $order = 0;

        foreach ($validated['services'] ?? [] as $svc) {
            QuotationItem::create([
                'quotation_id' => $quotation->id,
                'type'         => 'service',
                'description'  => $svc['description'],
                'quantity'     => 1,
                'unit_price'   => $svc['labor_cost'],
                'sort_order'   => $order++,
            ]);
        }

        foreach ($validated['parts'] ?? [] as $part) {
            QuotationItem::create([
                'quotation_id' => $quotation->id,
                'type'         => 'part',
                'description'  => $part['description'],
                'part_type'    => $part['part_type'] ?? null,
                'quantity'     => $part['quantity'],
                'unit_price'   => $part['unit_price'],
                'sort_order'   => $order++,
            ]);
        }
    }

    private function formatQuotation(Quotation $quotation, $services, $parts): array
    {
        $totalServices = $services->sum(fn($i) => (float) $i->unit_price);
        $totalParts    = $parts->sum(fn($i) => (float) $i->total_price);

        return [
            'id'                    => $quotation->id,
            'reference_number'      => $quotation->reference_number,
            'customer_id'           => $quotation->customer_id,
            'customer_name'         => $quotation->customer_name,
            'customer_phone'        => $quotation->customer_phone,
            'status'                => $quotation->status,
            'status_label'          => Quotation::statusLabel($quotation->status),
            'notes'                 => $quotation->notes,
            'valid_days'            => $quotation->valid_days,
            'created_at'            => $quotation->created_at->format('Y-m-d'),
            'converted_to_motor_id' => $quotation->converted_to_motor_id,
            'converted_motor_ref'   => $quotation->convertedToMotor?->reference_number,
            'services'              => $services->map(fn($i) => [
                'id'          => $i->id,
                'description' => $i->description,
                'labor_cost'  => (float) $i->unit_price,
            ])->toArray(),
            'parts' => $parts->map(fn($i) => [
                'id'              => $i->id,
                'description'     => $i->description,
                'part_type'       => $i->part_type,
                'part_type_label' => $i->part_type ? QuotationItem::partTypeLabel($i->part_type) : '',
                'quantity'        => (float) $i->quantity,
                'unit_price'      => (float) $i->unit_price,
                'total_price'     => (float) $i->total_price,
            ])->toArray(),
            'total_services' => $totalServices,
            'total_parts'    => $totalParts,
            'grand_total'    => $totalServices + $totalParts,
        ];
    }
}
