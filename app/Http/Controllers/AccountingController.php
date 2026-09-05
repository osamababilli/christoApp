<?php

namespace App\Http\Controllers;

use App\Models\AccountEntry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AccountingController extends Controller
{
    public function index(Request $request): Response
    {
        [$from, $to] = $this->resolveDateRange($request);

        $query = AccountEntry::query()
            ->when($request->type, fn($q, $t) => $q->where('type', $t))
            ->when($request->search, fn($q, $s) => $q->where('description', 'like', "%{$s}%")
                ->orWhere('notes', 'like', "%{$s}%"))
            ->when($from, fn($q, $d) => $q->whereDate('entry_date', '>=', $d))
            ->when($to,   fn($q, $d) => $q->whereDate('entry_date', '<=', $d))
            ->latest('entry_date')
            ->latest('id');

        $entries = $query->paginate(20)->withQueryString();

        // الرصيد الإجمالي للخزنة يبقى محسوباً على كامل السجل بغض النظر عن فلتر الوقت
        $allTotals = AccountEntry::selectRaw('type, SUM(amount) as total')
            ->groupBy('type')
            ->pluck('total', 'type');

        $balance = (float) ($allTotals['income'] ?? 0)
            + (float) ($allTotals['deposit'] ?? 0)
            - (float) ($allTotals['expense'] ?? 0);

        // بينما إجماليات الدخل/المصروف في البطاقات تعكس فلتر الوقت المختار
        $periodTotals = AccountEntry::query()
            ->when($from, fn($q, $d) => $q->whereDate('entry_date', '>=', $d))
            ->when($to,   fn($q, $d) => $q->whereDate('entry_date', '<=', $d))
            ->selectRaw('type, SUM(amount) as total')
            ->groupBy('type')
            ->pluck('total', 'type');

        $totalIncome  = (float) ($periodTotals['income']  ?? 0);
        $totalExpense = (float) ($periodTotals['expense'] ?? 0);
        $totalDeposit = (float) ($periodTotals['deposit'] ?? 0);

        return Inertia::render('authenticated/accounting', [
            'entries' => $entries->through(fn($e) => [
                'id'          => $e->id,
                'type'        => $e->type,
                'type_label'  => AccountEntry::typeLabel($e->type),
                'amount'      => $e->amount,
                'description' => $e->description,
                'entry_date'  => $e->entry_date->format('Y-m-d'),
                'notes'       => $e->notes,
            ]),
            'summary' => [
                'balance'      => $balance,
                'total_income' => $totalIncome,
                'total_expense'=> $totalExpense,
                'total_deposit'=> $totalDeposit,
            ],
            'filters' => $request->only(['search', 'type', 'period', 'from', 'to']),
        ]);
    }

    /**
     * يحوّل فلتر الفترة (period) المُختار إلى تاريخي بداية/نهاية.
     * @return array{0: ?string, 1: ?string}
     */
    private function resolveDateRange(Request $request): array
    {
        $period = $request->period;
        $now    = now();

        if ($period === 'custom') {
            return [$request->from ?: null, $request->to ?: null];
        }

        $starts = match ($period) {
            'day'       => $now->copy()->startOfDay(),
            'week'      => $now->copy()->subDays(6)->startOfDay(),
            'month'     => $now->copy()->subDays(29)->startOfDay(),
            'quarter'   => $now->copy()->subMonths(3)->startOfDay(),
            'half_year' => $now->copy()->subMonths(6)->startOfDay(),
            'year'      => $now->copy()->subYear()->startOfDay(),
            default     => null,
        };

        if (! $starts) {
            return [null, null];
        }

        return [$starts->format('Y-m-d'), $now->format('Y-m-d')];
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'type'        => 'required|in:income,expense',
            'amount'      => 'required|numeric|min:0.01',
            'description' => 'required|string|max:255',
            'entry_date'  => 'required|date',
            'notes'       => 'nullable|string|max:1000',
        ]);

        AccountEntry::create($validated);

        return back()->with('success', 'تم تسجيل القيد');
    }

    public function destroy(AccountEntry $accounting): RedirectResponse
    {
        if ($accounting->transaction_id) {
            return back()->with('error', 'هذا القيد مولَّد من دفعة عميل — احذف الدفعة من صفحة العميل وسيُحذف القيد تلقائياً');
        }

        if (\App\Models\SupplierPayment::where('accounting_entry_id', $accounting->id)->exists()) {
            return back()->with('error', 'هذا القيد مولَّد من دفعة لمورد — احذف الدفعة من صفحة المورد وسيُحذف القيد تلقائياً');
        }

        $accounting->delete();

        return back()->with('success', 'تم حذف القيد');
    }

    public function printStatement(Request $request): Response
    {
        $query = AccountEntry::query()
            ->when($request->from, fn($q, $d) => $q->whereDate('entry_date', '>=', $d))
            ->when($request->to,   fn($q, $d) => $q->whereDate('entry_date', '<=', $d))
            ->when($request->type, fn($q, $t) => $q->where('type', $t))
            ->orderBy('entry_date')
            ->orderBy('id');

        $entries = $query->take(5000)->get()->map(fn($e) => [
            'id'          => $e->id,
            'type'        => $e->type,
            'type_label'  => AccountEntry::typeLabel($e->type),
            'amount'      => (float) $e->amount,
            'description' => $e->description,
            'entry_date'  => $e->entry_date->format('Y-m-d'),
            'notes'       => $e->notes,
        ]);

        // احسب الأرصدة بناءً على الفلتر المطبق
        $totals = AccountEntry::query()
            ->when($request->from, fn($q, $d) => $q->whereDate('entry_date', '>=', $d))
            ->when($request->to,   fn($q, $d) => $q->whereDate('entry_date', '<=', $d))
            ->when($request->type, fn($q, $t) => $q->where('type', $t))
            ->selectRaw('type, SUM(amount) as total')
            ->groupBy('type')
            ->pluck('total', 'type');

        $totalIncome  = (float) ($totals['income']  ?? 0);
        $totalExpense = (float) ($totals['expense'] ?? 0);
        $totalDeposit = (float) ($totals['deposit'] ?? 0);

        return Inertia::render('print/accounting', [
            'entries' => $entries,
            'summary' => [
                'balance'       => $totalIncome + $totalDeposit - $totalExpense,
                'total_income'  => $totalIncome,
                'total_expense' => $totalExpense,
                'total_deposit' => $totalDeposit,
            ],
            'filters' => [
                'from' => $request->from,
                'to'   => $request->to,
                'type' => $request->type,
            ],
        ]);
    }
}
