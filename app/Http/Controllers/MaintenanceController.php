<?php

namespace App\Http\Controllers;

use App\Models\MaintenanceOrder;
use App\Models\Motor;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class MaintenanceController extends Controller
{
    public function index(Request $request): Response
    {
        $query = MaintenanceOrder::with(['motor.customer'])
            ->whereHas('motor')
            ->when($request->status, fn($q, $s) => $q->where('status', $s))
            ->when($request->search, function ($q, $search) {
                $q->whereHas('motor', fn($q) => $q
                    ->where('reference_number', 'like', "%{$search}%")
                    ->orWhereHas('customer', fn($q) => $q
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                    )
                );
            })
            ->latest();

        $orders = $query->paginate(15)->withQueryString();

        return Inertia::render('authenticated/maintenance', [
            'orders' => $orders->through(fn($o) => [
                'id'               => $o->id,
                'motor_id'         => $o->motor_id,
                'reference_number' => $o->motor->reference_number,
                'customer_id'      => $o->motor->customer->id,
                'customer_name'    => $o->motor->customer->name,
                'customer_phone'   => $o->motor->customer->phone,
                'stage'            => $o->stage,
                'description'      => $o->description,
                'started_at'       => $o->started_at?->format('Y-m-d'),
                'completed_at'     => $o->completed_at?->format('Y-m-d'),
                'labor_cost'       => $o->labor_cost,
                'status'           => $o->status,
                'status_label'     => MaintenanceOrder::statusLabel($o->status),
                'stop_reason'      => $o->stop_reason,
                'is_locked'        => $o->motor->isLocked(),
            ]),
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'motor_id'    => 'required|exists:motors,id',
            'description' => 'required|string',
            'labor_cost'  => 'nullable|numeric|min:0',
            'status'      => 'required|in:in_progress,completed,on_hold',
            'stop_reason' => 'nullable|string|max:255',
            'started_at'  => 'nullable|date',
        ]);

        return DB::transaction(function () use ($validated) {
            $stage = MaintenanceOrder::where('motor_id', $validated['motor_id'])
                ->lockForUpdate()
                ->max('stage') + 1;

            MaintenanceOrder::create([
                ...$validated,
                'stage'      => $stage,
                'labor_cost' => $validated['labor_cost'] ?? 0,
                'started_at' => $validated['started_at'] ?? now(),
            ]);

            return back()->with('success', 'تمت إضافة أمر الصيانة');
        });
    }

    public function updateStatus(Request $request, MaintenanceOrder $maintenance): RedirectResponse
    {
        if ($maintenance->motor->isLocked()) {
            return back()->with('error', 'لا يمكن التعديل — القيد مغلق.');
        }

        $validated = $request->validate([
            'status'      => 'required|in:in_progress,completed,on_hold',
            'stop_reason' => 'nullable|string|max:255',
        ]);

        if ($validated['status'] === 'completed' && ! $maintenance->completed_at) {
            $validated['completed_at'] = now();
        }

        $maintenance->update($validated);

        return back()->with('success', 'تم تحديث حالة أمر الصيانة');
    }

    public function update(Request $request, MaintenanceOrder $maintenance): RedirectResponse
    {
        $maintenance->load('motor');

        if ($maintenance->motor->isLocked()) {
            return back()->with('error', 'لا يمكن التعديل — القيد مغلق.');
        }

        $validated = $request->validate([
            'description'  => 'required|string',
            'labor_cost'   => 'nullable|numeric|min:0',
            'status'       => 'required|in:in_progress,completed,on_hold',
            'stop_reason'  => 'nullable|string|max:255',
            'completed_at' => 'nullable|date',
        ]);

        if ($validated['status'] === 'completed' && ! $maintenance->completed_at) {
            $validated['completed_at'] = $validated['completed_at'] ?? now();
        }

        $maintenance->update($validated);

        return back()->with('success', 'تم تحديث أمر الصيانة');
    }

    public function destroy(MaintenanceOrder $maintenance): RedirectResponse
    {
        $maintenance->load('motor');

        if ($maintenance->motor->isLocked()) {
            return back()->with('error', 'لا يمكن الحذف — القيد مغلق.');
        }

        $maintenance->delete();

        return back()->with('success', 'تم حذف أمر الصيانة');
    }
}
