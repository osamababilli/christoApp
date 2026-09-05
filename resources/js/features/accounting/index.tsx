import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
import { PaginationLinks } from '@/components/pagination-links';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { ThemeSwitch } from '@/components/theme-switch';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCan } from '@/hooks/use-can';
import { cn } from '@/lib/utils';
import { router, useForm } from '@inertiajs/react';
import {
    ArrowDownLeft,
    ArrowUpRight,
    FileText,
    Landmark,
    Loader2,
    Plus,
    Printer,
    Search,
    Trash2,
    TrendingDown,
    TrendingUp,
    Wallet,
    X,
} from 'lucide-react';
import { useState } from 'react';

/* ─────────────────────────── types ─────────────────────────── */

interface Entry {
    id: number;
    type: 'income' | 'expense' | 'deposit';
    type_label: string;
    amount: number;
    description: string;
    entry_date: string;
    notes: string | null;
}

interface Summary {
    balance: number;
    total_income: number;
    total_expense: number;
    total_deposit: number;
}

interface PaginatedEntries {
    data: Entry[];
    total: number;
    last_page: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    entries: PaginatedEntries;
    summary: Summary;
    filters: { search?: string; type?: string; period?: string; from?: string; to?: string };
}

const PERIOD_OPTIONS = [
    { value: '', label: 'الكل' },
    { value: 'day', label: 'يوم' },
    { value: 'week', label: 'اسبوع' },
    { value: 'month', label: 'شهر' },
    { value: 'quarter', label: '٣ أشهر' },
    { value: 'half_year', label: '٦ أشهر' },
    { value: 'year', label: 'سنة' },
    { value: 'custom', label: 'مخصص' },
] as const;

/* ──────────────────────── type config ──────────────────────── */

const TYPE = {
    income: {
        label: 'دخل',
        sign: '+',
        amountCls: 'text-emerald-600 dark:text-emerald-400',
        badgeCls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
        barCls: 'bg-emerald-500',
        chipCls: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-300',
        activeCls: 'ring-2 ring-emerald-400',
        rowAccent: 'border-s-emerald-400',
        cardBg: 'from-emerald-500/10 to-transparent',
        cardBorder: 'border-emerald-200 dark:border-emerald-800',
        cardText: 'text-emerald-700 dark:text-emerald-400',
        Icon: TrendingUp,
    },
    expense: {
        label: 'مصروف',
        sign: '−',
        amountCls: 'text-rose-600 dark:text-rose-400',
        badgeCls: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
        barCls: 'bg-rose-500',
        chipCls: 'border-rose-300 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:border-rose-700 dark:text-rose-300',
        activeCls: 'ring-2 ring-rose-400',
        rowAccent: 'border-s-rose-400',
        cardBg: 'from-rose-500/10 to-transparent',
        cardBorder: 'border-rose-200 dark:border-rose-800',
        cardText: 'text-rose-700 dark:text-rose-400',
        Icon: TrendingDown,
    },
    deposit: {
        label: 'إيداع',
        sign: '+',
        amountCls: 'text-sky-600 dark:text-sky-400',
        badgeCls: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800',
        barCls: 'bg-sky-500',
        chipCls: 'border-sky-300 bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:border-sky-700 dark:text-sky-300',
        activeCls: 'ring-2 ring-sky-400',
        rowAccent: 'border-s-sky-400',
        cardBg: 'from-sky-500/10 to-transparent',
        cardBorder: 'border-sky-200 dark:border-sky-800',
        cardText: 'text-sky-700 dark:text-sky-400',
        Icon: ArrowDownLeft,
    },
} as const;

/* ─────────────────────────── form ──────────────────────────── */

function EntryForm({ onCancel }: { onCancel: () => void }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        type: 'income' as 'income' | 'expense',
        amount: '',
        description: '',
        entry_date: new Date().toISOString().slice(0, 10),
        notes: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/accounting', {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onCancel();
            },
        });
    }

    const active = TYPE[data.type];

    return (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            {/* Coloured top stripe */}
            <div className={cn('h-1 w-full', active.barCls, 'transition-colors duration-300')} />

            <form onSubmit={submit} className="space-y-5 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h4 className="text-base font-semibold tracking-tight">قيد محاسبي جديد</h4>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Type selector */}
                <div className="space-y-2">
                    <Label className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">نوع القيد</Label>
                    <div className="grid grid-cols-2 gap-2">
                        {(Object.entries(TYPE).filter(([val]) => val !== 'deposit') as ['income' | 'expense', typeof TYPE.income][]).map(
                            ([val, cfg]) => {
                                const Icon = cfg.Icon;
                                const isSelected = data.type === val;
                                return (
                                    <button
                                        key={val}
                                        type="button"
                                        onClick={() => setData('type', val)}
                                        className={cn(
                                            'group relative flex cursor-pointer flex-col items-center gap-1.5 overflow-hidden rounded-xl border-2 px-3 py-3 text-sm font-semibold transition-all duration-200',
                                            isSelected
                                                ? cn(cfg.chipCls, cfg.activeCls, 'shadow-sm')
                                                : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/60',
                                        )}
                                    >
                                        <Icon className={cn('h-4 w-4 transition-transform duration-200', isSelected && 'scale-110')} />
                                        <span>{cfg.label}</span>
                                        {isSelected && <span className={cn('absolute start-0 end-0 bottom-0 h-0.5', cfg.barCls)} />}
                                    </button>
                                );
                            },
                        )}
                    </div>
                </div>

                {/* Fields */}
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="acc-desc" className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                            البيان <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="acc-desc"
                            className="min-h-[42px] text-sm"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            placeholder="وصف القيد المحاسبي..."
                            autoFocus
                        />
                        {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="acc-amount" className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                            المبلغ <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                            <Input
                                id="acc-amount"
                                type="number"
                                min="0.01"
                                step="0.01"
                                className={cn('min-h-[42px] ps-8 font-mono text-sm font-semibold', active.amountCls)}
                                value={data.amount}
                                onChange={(e) => setData('amount', e.target.value)}
                                placeholder="0.00"
                            />
                            <span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                                $
                            </span>
                        </div>
                        {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="acc-date" className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                            التاريخ
                        </Label>
                        <Input
                            id="acc-date"
                            type="date"
                            dir="ltr"
                            className="min-h-[42px] text-sm"
                            value={data.entry_date}
                            onChange={(e) => setData('entry_date', e.target.value)}
                        />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="acc-notes" className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                            ملاحظات
                        </Label>
                        <Textarea
                            id="acc-notes"
                            className="min-h-[70px] resize-none text-sm"
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            placeholder="اختياري..."
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                    <Button type="submit" className={cn('min-h-[42px] flex-1 gap-2 font-semibold transition-all')} disabled={processing}>
                        {processing ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" /> جاري الحفظ...
                            </>
                        ) : (
                            <>
                                <Plus className="h-4 w-4" /> تسجيل القيد
                            </>
                        )}
                    </Button>
                    <Button type="button" variant="outline" className="min-h-[42px] px-6" onClick={onCancel}>
                        إلغاء
                    </Button>
                </div>
            </form>
        </div>
    );
}

/* ─────────────────────── stat card ─────────────────────────── */

function StatCard({
    label,
    value,
    icon: Icon,
    bgGradient,
    borderCls,
    textCls,
    barCls,
}: {
    label: string;
    value: number;
    icon: React.ElementType;
    bgGradient: string;
    borderCls: string;
    textCls: string;
    barCls: string;
}) {
    return (
        <div className={cn('relative overflow-hidden rounded-2xl border bg-card p-5 transition-shadow hover:shadow-md', borderCls)}>
            {/* Background gradient */}
            <div className={cn('absolute inset-0 bg-gradient-to-br opacity-60', bgGradient)} />

            <div className="relative space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">{label}</span>
                    <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', bgGradient, 'border bg-gradient-to-br', borderCls)}>
                        <Icon className={cn('h-4 w-4', textCls)} />
                    </span>
                </div>

                <p className={cn('font-mono text-2xl font-bold tracking-tight', textCls)}>
                    <span className="me-0.5 text-base font-normal opacity-70">$</span>
                    {value.toFixed(2)}
                </p>

                <div className={cn('h-0.5 w-full rounded-full opacity-30', barCls)} />
            </div>
        </div>
    );
}

/* ─────────────────────── main component ───────────────────── */

export function Accounting({ entries, summary, filters }: Props) {
    const can = useCan();
    const [search, setSearch] = useState(filters.search ?? '');
    const [type, setType] = useState(filters.type ?? '');
    const [period, setPeriod] = useState(filters.period ?? '');
    const [dateFrom, setDateFrom] = useState(filters.from ?? '');
    const [dateTo, setDateTo] = useState(filters.to ?? '');
    const [showForm, setShowForm] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Entry | null>(null);
    const [showStatement, setShowStatement] = useState(false);
    const [stmtFrom, setStmtFrom] = useState('');
    const [stmtTo, setStmtTo] = useState('');
    const [stmtType, setStmtType] = useState('');

    function openStatement() {
        const params = new URLSearchParams();
        if (stmtFrom) params.set('from', stmtFrom);
        if (stmtTo) params.set('to', stmtTo);
        if (stmtType) params.set('type', stmtType);
        window.open(`/accounting/print?${params.toString()}`, '_blank');
        setShowStatement(false);
    }

    function applyFilters(overrides: Partial<{ search: string; type: string; period: string; from: string; to: string }> = {}) {
        router.get(
            '/accounting',
            {
                search: overrides.search ?? search,
                type: overrides.type ?? type,
                period: overrides.period ?? period,
                from: overrides.from ?? dateFrom,
                to: overrides.to ?? dateTo,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    }

    function selectPeriod(value: string) {
        setPeriod(value);
        if (value === 'custom') return; // ينتظر اختيار التواريخ ثم الضغط على "تطبيق"
        setDateFrom('');
        setDateTo('');
        applyFilters({ period: value, from: '', to: '' });
    }

    function applyCustomRange() {
        applyFilters({ period: 'custom', from: dateFrom, to: dateTo });
    }

    function handleDelete() {
        if (!deleteTarget) return;
        router.delete(`/accounting/${deleteTarget.id}`, { preserveScroll: true });
        setDeleteTarget(null);
    }

    const isPositive = summary.balance >= 0;
    const totalFlow = summary.total_income;
    const incomeRatio = totalFlow > 0 ? (summary.total_income / totalFlow) * 100 : 0;

    const typeFilterOptions = [
        { value: '', label: 'جميع القيود' },
        { value: 'income', label: 'الدخل' },
        { value: 'expense', label: 'المصاريف' },
    ];

    return (
        <>
            {/* ── Header ── */}
            <Header fixed>
                <div className="flex flex-1 items-center gap-3">
                    <div className="relative max-w-sm flex-1">
                        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            className="min-h-[44px] ps-9"
                            placeholder="بحث في البيانات..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                        />
                    </div>
                </div>
                <div className="ms-auto flex items-center gap-3">
                    <ThemeSwitch />
                    <ProfileDropdown />
                </div>
            </Header>

            <Main className="flex flex-1 flex-col gap-6 pb-12">
                {/* ── Page title ── */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">المحاسبة والخزنة</h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">{entries.total} قيد مسجّل</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => setShowStatement(!showStatement)} className="min-h-[42px] gap-2 px-4 font-semibold">
                            <Printer className="h-4 w-4" />
                            كشف حساب
                        </Button>
                        <Button onClick={() => setShowForm(!showForm)} className="min-h-[42px] gap-2 px-5 font-semibold shadow-sm">
                            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                            {showForm ? 'إغلاق' : 'قيد جديد'}
                        </Button>
                    </div>
                </div>

                {/* ── Statement panel ── */}
                {showStatement && (
                    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                        <div className="h-1 w-full bg-gradient-to-r from-primary/60 to-primary" />
                        <div className="space-y-4 p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                    <h4 className="text-base font-semibold">استخراج كشف حساب</h4>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowStatement(false)}
                                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">من تاريخ</Label>
                                    <Input
                                        type="date"
                                        dir="ltr"
                                        className="min-h-[42px]"
                                        value={stmtFrom}
                                        onChange={(e) => setStmtFrom(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">إلى تاريخ</Label>
                                    <Input
                                        type="date"
                                        dir="ltr"
                                        className="min-h-[42px]"
                                        value={stmtTo}
                                        onChange={(e) => setStmtTo(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">نوع القيود</Label>
                                    <select
                                        className="flex h-[42px] w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                        value={stmtType}
                                        onChange={(e) => setStmtType(e.target.value)}
                                    >
                                        <option value="">جميع القيود</option>
                                        <option value="income">الدخل فقط</option>
                                        <option value="expense">المصاريف فقط</option>
                                    </select>
                                </div>
                            </div>

                            <p className="text-xs text-muted-foreground">اتركها فارغة لاستخراج جميع الحركات بدون فلتر تاريخ.</p>

                            <div className="flex gap-3 pt-1">
                                <Button onClick={openStatement} className="min-h-[42px] flex-1 gap-2 font-semibold">
                                    <Printer className="h-4 w-4" />
                                    فتح الكشف للطباعة
                                </Button>
                                <Button variant="outline" className="min-h-[42px] px-6" onClick={() => setShowStatement(false)}>
                                    إلغاء
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Treasury hero ── */}
                <div
                    className={cn(
                        'relative overflow-hidden rounded-2xl border-2 p-8 transition-all duration-500',
                        isPositive ? 'border-emerald-200 dark:border-emerald-800' : 'border-rose-200 dark:border-rose-800',
                    )}
                >
                    {/* Mesh gradient background */}
                    <div
                        className="absolute inset-0"
                        style={{
                            background: isPositive
                                ? 'radial-gradient(ellipse 80% 80% at 10% 50%, oklch(0.87 0.15 162 / 0.18) 0%, transparent 70%), radial-gradient(ellipse 60% 60% at 90% 20%, oklch(0.87 0.15 162 / 0.10) 0%, transparent 60%)'
                                : 'radial-gradient(ellipse 80% 80% at 10% 50%, oklch(0.80 0.17 20 / 0.18) 0%, transparent 70%), radial-gradient(ellipse 60% 60% at 90% 20%, oklch(0.80 0.17 20 / 0.10) 0%, transparent 60%)',
                        }}
                    />

                    {/* Decorative circle */}
                    <div
                        className={cn('absolute -end-16 -top-16 h-56 w-56 rounded-full opacity-10', isPositive ? 'bg-emerald-400' : 'bg-rose-400')}
                    />
                    <div
                        className={cn('absolute end-24 -bottom-10 h-32 w-32 rounded-full opacity-5', isPositive ? 'bg-emerald-500' : 'bg-rose-500')}
                    />

                    <div className="relative flex flex-wrap items-center justify-between gap-6">
                        {/* Left: icon + label */}
                        <div className="flex items-center gap-4">
                            <div
                                className={cn(
                                    'flex h-14 w-14 items-center justify-center rounded-2xl border-2 shadow-sm',
                                    isPositive
                                        ? 'border-emerald-200 bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-900/60'
                                        : 'border-rose-200 bg-rose-100 dark:border-rose-700 dark:bg-rose-900/60',
                                )}
                            >
                                <Landmark
                                    className={cn(
                                        'h-7 w-7',
                                        isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
                                    )}
                                />
                            </div>
                            <div>
                                <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">رصيد الخزنة</p>
                                <p className="mt-0.5 text-sm text-muted-foreground">{isPositive ? 'رصيد إيجابي ✓' : 'رصيد سالب — مراجعة مطلوبة'}</p>
                            </div>
                        </div>

                        {/* Right: balance number */}
                        <div className="text-end">
                            <p
                                className={cn(
                                    'font-mono text-5xl leading-none font-extrabold tracking-tight',
                                    isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
                                )}
                            >
                                <span className="me-1 text-3xl font-normal opacity-70">$</span>
                                {isPositive ? '' : '−'}
                                {Math.abs(summary.balance).toFixed(2)}
                            </p>
                            <p className="mt-1 text-xs font-semibold tracking-widest text-muted-foreground uppercase">دولار أمريكي</p>
                        </div>
                    </div>

                    {/* Flow bar */}
                    {totalFlow > 0 && (
                        <div className="relative mt-6">
                            <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                                <span>توزيع الواردات</span>
                                <span>إجمالي وارد: ${totalFlow.toFixed(2)}</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-muted/50">
                                <div className="flex h-full">
                                    <div className="h-full bg-emerald-500 transition-all duration-700" style={{ width: `${incomeRatio}%` }} />
                                </div>
                            </div>
                            <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                                    دخل ({incomeRatio.toFixed(0)}%)
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Stat cards ── */}
                <div className="grid gap-4 sm:grid-cols-2">
                    <StatCard
                        label="إجمالي الدخل"
                        value={summary.total_income}
                        icon={TrendingUp}
                        bgGradient={TYPE.income.cardBg}
                        borderCls={TYPE.income.cardBorder}
                        textCls={TYPE.income.cardText}
                        barCls={TYPE.income.barCls}
                    />
                    <StatCard
                        label="إجمالي المصاريف"
                        value={summary.total_expense}
                        icon={ArrowUpRight}
                        bgGradient={TYPE.expense.cardBg}
                        borderCls={TYPE.expense.cardBorder}
                        textCls={TYPE.expense.cardText}
                        barCls={TYPE.expense.barCls}
                    />
                </div>

                {/* ── Form panel ── */}
                {showForm && <EntryForm onCancel={() => setShowForm(false)} />}

                {/* ── Time filter ── */}
                <div className="flex flex-wrap items-center gap-2">
                    {PERIOD_OPTIONS.map((opt) => {
                        const isActive = period === opt.value;
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => selectPeriod(opt.value)}
                                className={cn(
                                    'cursor-pointer rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-200',
                                    opt.value === ''
                                        ? cn(
                                              'border-border bg-muted/50 text-muted-foreground',
                                              isActive && 'border-foreground bg-foreground text-background',
                                          )
                                        : cn(
                                              isActive
                                                  ? 'border-primary/40 bg-primary/10 text-primary ring-2 ring-primary/30'
                                                  : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted',
                                          ),
                                )}
                            >
                                {isActive && opt.value !== '' && <span className="me-1.5 text-xs">✓</span>}
                                {opt.label}
                            </button>
                        );
                    })}

                    {period === 'custom' && (
                        <div className="flex flex-wrap items-center gap-2">
                            <Input
                                type="date"
                                dir="ltr"
                                className="h-9 w-auto text-sm"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />
                            <span className="text-xs text-muted-foreground">إلى</span>
                            <Input type="date" dir="ltr" className="h-9 w-auto text-sm" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                            <Button
                                type="button"
                                size="sm"
                                className="h-9 px-4 font-semibold"
                                onClick={applyCustomRange}
                                disabled={!dateFrom && !dateTo}
                            >
                                تطبيق
                            </Button>
                        </div>
                    )}
                </div>

                {/* ── Filters toolbar ── */}
                <div className="flex flex-wrap items-center gap-2">
                    {typeFilterOptions.map((opt) => {
                        const isActive = type === opt.value;
                        const cfg = opt.value ? TYPE[opt.value as keyof typeof TYPE] : null;
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                    setType(opt.value);
                                    applyFilters({ type: opt.value });
                                }}
                                className={cn(
                                    'cursor-pointer rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-200',
                                    opt.value === ''
                                        ? cn(
                                              'border-border bg-muted/50 text-muted-foreground',
                                              isActive && 'border-foreground bg-foreground text-background',
                                          )
                                        : cn(
                                              isActive
                                                  ? cn(cfg!.chipCls, cfg!.activeCls)
                                                  : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted',
                                          ),
                                )}
                            >
                                {isActive && opt.value !== '' && <span className="me-1.5 text-xs">✓</span>}
                                {opt.label}
                            </button>
                        );
                    })}

                    <div className="ms-auto text-xs text-muted-foreground">
                        {entries.data.length} من {entries.total} قيد
                    </div>
                </div>

                {/* ── Entries ── */}
                <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                    {/* Table header */}
                    <div className="grid grid-cols-[1fr_auto_2fr_auto_auto] items-center gap-4 border-b bg-muted/30 px-5 py-3 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                        <span>التاريخ</span>
                        <span>النوع</span>
                        <span>البيان</span>
                        <span className="text-end">المبلغ</span>
                        <span />
                    </div>

                    {entries.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-4 py-20 text-muted-foreground">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/20">
                                <Wallet className="h-7 w-7 opacity-30" />
                            </div>
                            <div className="text-center">
                                <p className="font-semibold">لا توجد قيود مسجّلة</p>
                                <p className="mt-1 text-sm opacity-60">ابدأ بإضافة قيد محاسبي جديد</p>
                            </div>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {entries.data.map((entry) => {
                                const cfg = TYPE[entry.type];
                                const Icon = cfg.Icon;
                                return (
                                    <div
                                        key={entry.id}
                                        className={cn(
                                            'group grid grid-cols-[1fr_auto_2fr_auto_auto] items-center gap-4 border-s-4 px-5 py-4 transition-colors duration-150 hover:bg-muted/30',
                                            cfg.rowAccent,
                                        )}
                                    >
                                        {/* Date */}
                                        <span className="block text-right font-mono text-xs text-muted-foreground" dir="ltr">
                                            {entry.entry_date}
                                        </span>

                                        {/* Type badge */}
                                        <span
                                            className={cn(
                                                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
                                                cfg.badgeCls,
                                            )}
                                        >
                                            <Icon className="h-3 w-3" />
                                            {cfg.label}
                                        </span>

                                        {/* Description + notes */}
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium">{entry.description}</p>
                                            {entry.notes && <p className="mt-0.5 truncate text-xs text-muted-foreground">{entry.notes}</p>}
                                        </div>

                                        {/* Amount */}
                                        <span className={cn('font-mono text-sm font-bold tabular-nums', cfg.amountCls)} dir="ltr">
                                            {cfg.sign}${Number(entry.amount).toFixed(2)}
                                        </span>

                                        {/* Delete */}
                                        {can('manage-accounting') && (
                                            <button
                                                type="button"
                                                onClick={() => setDeleteTarget(entry)}
                                                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-all duration-150 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── Pagination ── */}
                {entries.last_page > 1 && <PaginationLinks links={entries.links} />}
            </Main>

            {/* ── Delete dialog ── */}
            <AlertDialog
                open={!!deleteTarget}
                onOpenChange={(open) => {
                    if (!open) setDeleteTarget(null);
                }}
            >
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>تأكيد حذف القيد</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-1">
                            <span>سيتم حذف القيد </span>
                            <span className="font-semibold text-foreground">"{deleteTarget?.description}"</span>
                            <span> بمبلغ </span>
                            <span className="font-mono font-bold text-foreground" dir="ltr">
                                ${deleteTarget?.amount}
                            </span>
                            <span> نهائياً.</span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                            className="text-destructive-foreground rounded-xl bg-destructive hover:bg-destructive/90"
                            onClick={handleDelete}
                        >
                            نعم، احذف
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
