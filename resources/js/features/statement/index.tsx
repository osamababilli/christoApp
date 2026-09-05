import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { ThemeSwitch } from '@/components/theme-switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { router, useForm } from '@inertiajs/react';
import {
    Banknote,
    CheckCircle2,
    Landmark,
    ListChecks,
    Loader2,
    Receipt,
    Search,
    User,
    Wallet,
} from 'lucide-react';
import { useMemo, useState } from 'react';

/* ─────────────────────────── types ─────────────────────────── */

interface CustomerOption {
    id: number;
    name: string;
    phone: string;
    account_type: 'direct' | 'account';
}

interface Invoice {
    id: number;
    invoice_number: string;
    description: string;
    issued_date: string;
    amount: number;
    paid: number;
    remaining: number;
    is_paid: boolean;
}

interface Props {
    customers: CustomerOption[];
    selected_customer: CustomerOption | null;
    invoices: Invoice[];
}

const PAYMENT_METHODS = [
    { value: 'cash',  label: 'نقداً',  Icon: Banknote },
    { value: 'whish', label: 'Whish',  Icon: Wallet },
    { value: 'omt',   label: 'OMT',    Icon: Wallet },
    { value: 'check', label: 'شيك',    Icon: Receipt },
] as const;

type PaymentMethod = (typeof PAYMENT_METHODS)[number]['value'];

function fmt(n: number) {
    return n.toFixed(2);
}

/* ─────────────────────── main component ───────────────────── */

export function Statement({ customers, selected_customer, invoices }: Props) {
    const [customerSearch, setCustomerSearch] = useState('');
    const [mode, setMode]                     = useState<'per_invoice' | 'on_account'>(
        selected_customer?.account_type === 'account' ? 'on_account' : 'per_invoice',
    );
    const [selectedIds, setSelectedIds]       = useState<Record<number, string>>({});
    const [errors, setErrors]                 = useState<Record<string, string>>({});
    const [processing, setProcessing]         = useState(false);

    const { data, setData, reset } = useForm({
        payment_method:   'cash' as PaymentMethod,
        account_name:     '',
        reference_no:     '',
        amount:           '',
        notes:            '',
        transaction_date: new Date().toISOString().slice(0, 10),
    });

    const isAccount = selected_customer?.account_type === 'account';

    const filteredCustomers = useMemo(() => {
        const q = customerSearch.trim().toLowerCase();
        if (!q) return customers;
        return customers.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q));
    }, [customers, customerSearch]);

    function selectCustomer(id: number) {
        router.get('/statement', { customer_id: id }, {
            preserveState: true,
            replace: true,
            onSuccess: () => { setSelectedIds({}); reset(); },
        });
    }

    function toggleInvoice(invoice: Invoice, checked: boolean) {
        if (invoice.is_paid) return;
        setSelectedIds((prev) => {
            const next = { ...prev };
            if (checked) {
                next[invoice.id] = fmt(invoice.remaining);
            } else {
                delete next[invoice.id];
            }
            return next;
        });
    }

    function setAllocationAmount(id: number, value: string) {
        setSelectedIds((prev) => ({ ...prev, [id]: value }));
    }

    const totalAllocated = Object.values(selectedIds).reduce((s, v) => s + (parseFloat(v) || 0), 0);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (!selected_customer) return;

        const payload: Record<string, unknown> = {
            mode,
            payment_method:   data.payment_method,
            account_name:     data.account_name,
            reference_no:     data.reference_no,
            notes:            data.notes,
            transaction_date: data.transaction_date,
        };

        if (mode === 'per_invoice') {
            payload.allocations = Object.entries(selectedIds)
                .filter(([, amt]) => parseFloat(amt) > 0)
                .map(([invoiceId, amt]) => ({ invoice_id: Number(invoiceId), amount: parseFloat(amt) }));
        } else {
            payload.amount = data.amount;
        }

        setProcessing(true);
        setErrors({});
        router.post(`/statement/${selected_customer.id}/pay`, payload as never, {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setSelectedIds({});
            },
            onError: (errs) => setErrors(errs as Record<string, string>),
            onFinish: () => setProcessing(false),
        });
    }

    return (
        <>
            <Header fixed>
                <div className="flex flex-1 items-center gap-3">
                    <div className="relative max-w-sm flex-1">
                        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            className="ps-9 min-h-[44px]"
                            placeholder="بحث عن عميل..."
                            value={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)}
                        />
                    </div>
                </div>
                <div className="ms-auto flex items-center gap-3">
                    <ThemeSwitch />
                    <ProfileDropdown />
                </div>
            </Header>

            <Main className="flex flex-1 flex-col gap-6 pb-12">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">كشف حساب</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">اختر العميل ثم سجّل دفعة على الفواتير أو على الحساب مباشرة</p>
                </div>

                <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
                    {/* ── Customer picker ── */}
                    <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
                        <div className="border-b px-4 py-3">
                            <h3 className="text-sm font-semibold">العملاء</h3>
                        </div>
                        <div className="max-h-[600px] overflow-y-auto divide-y">
                            {filteredCustomers.length === 0 && (
                                <p className="p-4 text-center text-sm text-muted-foreground">لا يوجد عملاء مطابقون</p>
                            )}
                            {filteredCustomers.map((c) => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => selectCustomer(c.id)}
                                    className={cn(
                                        'flex w-full items-center justify-between gap-2 px-4 py-3 text-start transition-colors hover:bg-muted/50',
                                        selected_customer?.id === c.id && 'bg-primary/10',
                                    )}
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold">{c.name}</p>
                                        <p className="truncate text-xs text-muted-foreground" dir="ltr">{c.phone}</p>
                                    </div>
                                    {c.account_type === 'account' && (
                                        <Wallet className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── Details / payment form ── */}
                    {!selected_customer ? (
                        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-24 text-muted-foreground">
                            <User className="h-10 w-10 opacity-30" />
                            <p className="font-semibold">اختر عميلاً من القائمة للبدء</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Customer header */}
                            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card px-5 py-4 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                                        <User className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold">{selected_customer.name}</p>
                                        <p className="text-xs text-muted-foreground" dir="ltr">{selected_customer.phone}</p>
                                    </div>
                                </div>
                                {isAccount && (
                                    <Badge className="gap-1 bg-blue-100 text-blue-800 border-blue-300">
                                        <Wallet className="h-3 w-3" />
                                        حساب جاري
                                    </Badge>
                                )}
                            </div>

                            <form onSubmit={submit} className="space-y-6">
                                {/* Mode toggle */}
                                <div className="rounded-2xl border bg-card p-1.5 shadow-sm flex gap-1.5">
                                    <button
                                        type="button"
                                        disabled={isAccount}
                                        onClick={() => setMode('per_invoice')}
                                        className={cn(
                                            'flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all',
                                            mode === 'per_invoice' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-muted',
                                            isAccount && 'opacity-40 cursor-not-allowed',
                                        )}
                                    >
                                        <ListChecks className="h-4 w-4" />
                                        الدفع حسب الفاتورة
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMode('on_account')}
                                        className={cn(
                                            'flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all',
                                            mode === 'on_account' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-muted',
                                        )}
                                    >
                                        <Landmark className="h-4 w-4" />
                                        دفعة على الحساب
                                    </button>
                                </div>
                                {isAccount && (
                                    <p className="text-xs text-muted-foreground -mt-4">
                                        هذا العميل يملك حساباً جارياً — الدفع يتم كدفعة عامة على الحساب فقط.
                                    </p>
                                )}

                                {/* Per-invoice mode */}
                                {mode === 'per_invoice' && (
                                    <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
                                        <div className="border-b bg-muted/30 px-5 py-3">
                                            <h4 className="text-sm font-semibold">الفواتير</h4>
                                        </div>
                                        {invoices.length === 0 ? (
                                            <p className="py-10 text-center text-sm text-muted-foreground">لا توجد فواتير لهذا العميل</p>
                                        ) : (
                                            <div className="divide-y">
                                                {invoices.map((inv) => {
                                                    const checked = selectedIds[inv.id] !== undefined;
                                                    return (
                                                        <div
                                                            key={inv.id}
                                                            className={cn(
                                                                'flex flex-wrap items-center gap-3 px-5 py-3',
                                                                inv.is_paid && 'opacity-70 bg-emerald-50/40 dark:bg-emerald-950/10',
                                                            )}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                className="h-4 w-4 rounded border-input disabled:cursor-not-allowed"
                                                                checked={checked}
                                                                disabled={inv.is_paid}
                                                                onChange={(e) => toggleInvoice(inv, e.target.checked)}
                                                            />
                                                            <div className="min-w-[140px] flex-1">
                                                                <p className="font-mono text-sm font-semibold">{inv.invoice_number}</p>
                                                                <p className="text-xs text-muted-foreground">{inv.description} · {inv.issued_date}</p>
                                                            </div>
                                                            <div className="text-end text-xs text-muted-foreground">
                                                                <p>الإجمالي: <span className="font-mono">${fmt(inv.amount)}</span></p>
                                                                {!inv.is_paid && (
                                                                    <p>المتبقي: <span className="font-mono font-semibold text-foreground">${fmt(inv.remaining)}</span></p>
                                                                )}
                                                            </div>
                                                            {inv.is_paid ? (
                                                                <Badge className="gap-1 bg-emerald-100 text-emerald-800 border-emerald-300">
                                                                    <CheckCircle2 className="h-3 w-3" />
                                                                    مدفوعة
                                                                </Badge>
                                                            ) : (
                                                                <div className="relative w-32">
                                                                    <Input
                                                                        type="number"
                                                                        min="0.01"
                                                                        step="0.01"
                                                                        max={inv.remaining}
                                                                        disabled={!checked}
                                                                        className="h-9 ps-6 font-mono text-sm"
                                                                        value={selectedIds[inv.id] ?? ''}
                                                                        onChange={(e) => setAllocationAmount(inv.id, e.target.value)}
                                                                    />
                                                                    <span className="pointer-events-none absolute start-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        {Object.keys(selectedIds).length > 0 && (
                                            <div className="flex items-center justify-between border-t bg-muted/20 px-5 py-3 text-sm">
                                                <span className="text-muted-foreground">إجمالي الدفعة المخصصة</span>
                                                <span className="font-mono font-bold">${fmt(totalAllocated)}</span>
                                            </div>
                                        )}
                                        {errors.allocations && <p className="px-5 pb-3 text-xs text-destructive">{errors.allocations}</p>}
                                    </div>
                                )}

                                {/* On-account mode */}
                                {mode === 'on_account' && (
                                    <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-2">
                                        <Label htmlFor="stmt-amount" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                            المبلغ <span className="text-destructive">*</span>
                                        </Label>
                                        <div className="relative max-w-xs">
                                            <Input
                                                id="stmt-amount"
                                                type="number"
                                                min="0.01"
                                                step="0.01"
                                                className="min-h-[42px] ps-8 font-mono text-sm font-semibold"
                                                placeholder="0.00"
                                                value={data.amount}
                                                onChange={(e) => setData('amount', e.target.value)}
                                            />
                                            <span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">$</span>
                                        </div>
                                        {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
                                    </div>
                                )}

                                {/* Payment method */}
                                <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
                                    <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                        طريقة الدفع
                                    </Label>
                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                        {PAYMENT_METHODS.map(({ value, label, Icon }) => (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() => setData('payment_method', value)}
                                                className={cn(
                                                    'flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3 text-sm font-semibold transition-all',
                                                    data.payment_method === value
                                                        ? 'border-primary/50 bg-primary/10 text-primary ring-2 ring-primary/30'
                                                        : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/60',
                                                )}
                                            >
                                                <Icon className="h-4 w-4" />
                                                {label}
                                            </button>
                                        ))}
                                    </div>

                                    {(data.payment_method === 'whish' || data.payment_method === 'omt') && (
                                        <div className="space-y-1.5">
                                            <Label htmlFor="stmt-account-name" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                                من أي رقم / حساب <span className="text-destructive">*</span>
                                            </Label>
                                            <Input
                                                id="stmt-account-name"
                                                dir="ltr"
                                                className="min-h-[42px] max-w-xs text-sm"
                                                placeholder="مثال: 03123456"
                                                value={data.account_name}
                                                onChange={(e) => setData('account_name', e.target.value)}
                                            />
                                            {errors.account_name && <p className="text-xs text-destructive">{errors.account_name}</p>}
                                        </div>
                                    )}

                                    {data.payment_method === 'check' && (
                                        <div className="space-y-1.5">
                                            <Label htmlFor="stmt-reference-no" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                                رقم الشيك <span className="text-destructive">*</span>
                                            </Label>
                                            <Input
                                                id="stmt-reference-no"
                                                dir="ltr"
                                                className="min-h-[42px] max-w-xs text-sm"
                                                placeholder="مثال: 000123"
                                                value={data.reference_no}
                                                onChange={(e) => setData('reference_no', e.target.value)}
                                            />
                                            {errors.reference_no && <p className="text-xs text-destructive">{errors.reference_no}</p>}
                                        </div>
                                    )}

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="stmt-date" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                                التاريخ
                                            </Label>
                                            <Input
                                                id="stmt-date"
                                                type="date"
                                                dir="ltr"
                                                className="min-h-[42px] text-sm"
                                                value={data.transaction_date}
                                                onChange={(e) => setData('transaction_date', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="stmt-notes" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                                ملاحظات
                                            </Label>
                                            <Textarea
                                                id="stmt-notes"
                                                className="min-h-[42px] resize-none text-sm"
                                                placeholder="اختياري..."
                                                value={data.notes}
                                                onChange={(e) => setData('notes', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {errors.mode && <p className="text-sm text-destructive">{errors.mode}</p>}

                                <Button type="submit" className="gap-2 min-h-[44px] px-8 font-semibold" disabled={processing}>
                                    {processing
                                        ? <><Loader2 className="h-4 w-4 animate-spin" /> جاري الحفظ...</>
                                        : <><CheckCircle2 className="h-4 w-4" /> تسجيل الدفعة</>}
                                </Button>
                            </form>
                        </div>
                    )}
                </div>
            </Main>
        </>
    );
}
