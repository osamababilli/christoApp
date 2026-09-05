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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCan } from '@/hooks/use-can';
import { cn } from '@/lib/utils';
import { router, useForm } from '@inertiajs/react';
import { FileSpreadsheet, Loader2, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useState } from 'react';

/* ─────────────────────────── types ─────────────────────────── */

interface CustomerOption {
    id: number;
    name: string;
    phone: string;
}

interface InvoiceRow {
    id: number;
    invoice_number: string;
    customer_id: number;
    customer_name: string;
    motor_id: number | null;
    motor_reference: string | null;
    description: string;
    amount: number;
    paid: number;
    remaining: number;
    is_paid: boolean;
    issued_date: string;
    notes: string | null;
}

interface PaginatedInvoices {
    data: InvoiceRow[];
    total: number;
    last_page: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    invoices: PaginatedInvoices;
    customers: CustomerOption[];
    filters: { search?: string; customer_id?: string };
}

function fmt(n: number) {
    return n.toFixed(2);
}

/* ─────────────────────────── form ──────────────────────────── */

function InvoiceForm({ customers, editing, onCancel }: { customers: CustomerOption[]; editing?: InvoiceRow; onCancel: () => void }) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        customer_id: editing ? String(editing.customer_id) : '',
        description: editing?.description ?? '',
        amount: editing ? String(editing.amount) : '',
        issued_date: editing?.issued_date ?? new Date().toISOString().slice(0, 10),
        notes: editing?.notes ?? '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) {
            put(`/invoices/${editing.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    reset();
                    onCancel();
                },
            });
        } else {
            post('/invoices', {
                preserveScroll: true,
                onSuccess: () => {
                    reset();
                    onCancel();
                },
            });
        }
    }

    return (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="h-1 w-full bg-primary" />
            <form onSubmit={submit} className="space-y-5 p-6">
                <div className="flex items-center justify-between">
                    <h4 className="text-base font-semibold tracking-tight">{editing ? 'تعديل فاتورة' : 'إصدار فاتورة جديدة'}</h4>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                        <Label className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                            العميل <span className="text-destructive">*</span>
                        </Label>
                        <Select value={data.customer_id} onValueChange={(v) => setData('customer_id', v)}>
                            <SelectTrigger className="min-h-[42px] w-full text-sm">
                                <SelectValue placeholder="اختر العميل" />
                            </SelectTrigger>
                            <SelectContent>
                                {customers.map((c) => (
                                    <SelectItem key={c.id} value={String(c.id)}>
                                        {c.name} — {c.phone}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.customer_id && <p className="text-xs text-destructive">{errors.customer_id}</p>}
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="inv-desc" className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                            البيان <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="inv-desc"
                            className="min-h-[42px] text-sm"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            placeholder="وصف الفاتورة..."
                        />
                        {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="inv-amount" className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                            المبلغ <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                            <Input
                                id="inv-amount"
                                type="number"
                                min="0.01"
                                step="0.01"
                                className="min-h-[42px] ps-8 font-mono text-sm font-semibold"
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
                        <Label htmlFor="inv-date" className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                            تاريخ الإصدار
                        </Label>
                        <Input
                            id="inv-date"
                            type="date"
                            dir="ltr"
                            className="min-h-[42px] text-sm"
                            value={data.issued_date}
                            onChange={(e) => setData('issued_date', e.target.value)}
                        />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="inv-notes" className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                            ملاحظات
                        </Label>
                        <Textarea
                            id="inv-notes"
                            className="min-h-[70px] resize-none text-sm"
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            placeholder="اختياري..."
                        />
                    </div>
                </div>

                <div className="flex gap-3 pt-1">
                    <Button type="submit" className="min-h-[42px] flex-1 gap-2 font-semibold" disabled={processing}>
                        {processing ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" /> جاري الحفظ...
                            </>
                        ) : (
                            <>
                                <Plus className="h-4 w-4" /> {editing ? 'حفظ التعديل' : 'إصدار الفاتورة'}
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

/* ─────────────────────── main component ───────────────────── */

export function Invoices({ invoices, customers, filters }: Props) {
    const can = useCan();
    const [search, setSearch] = useState(filters.search ?? '');
    const [customerId, setCustomerId] = useState(filters.customer_id ?? '');
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<InvoiceRow | undefined>(undefined);
    const [deleteTarget, setDeleteTarget] = useState<InvoiceRow | null>(null);

    function applyFilters(overrides: Partial<{ search: string; customer_id: string }> = {}) {
        router.get(
            '/invoices',
            {
                search: overrides.search ?? search,
                customer_id: overrides.customer_id ?? customerId,
            },
            { preserveState: true, replace: true },
        );
    }

    function openCreate() {
        setEditing(undefined);
        setShowForm(true);
    }

    function openEdit(invoice: InvoiceRow) {
        setEditing(invoice);
        setShowForm(true);
    }

    function handleDelete() {
        if (!deleteTarget) return;
        router.delete(`/invoices/${deleteTarget.id}`, { preserveScroll: true });
        setDeleteTarget(null);
    }

    return (
        <>
            <Header fixed>
                <div className="flex flex-1 items-center gap-3">
                    <div className="relative max-w-sm flex-1">
                        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            className="min-h-[44px] ps-9"
                            placeholder="بحث برقم الفاتورة أو العميل..."
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
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">الفواتير</h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">{invoices.total} فاتورة — إصدار يدوي مستقل عن قيود الاستلام</p>
                    </div>
                    <Button onClick={showForm ? () => setShowForm(false) : openCreate} className="min-h-[42px] gap-2 px-5 font-semibold shadow-sm">
                        {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        {showForm ? 'إغلاق' : 'فاتورة جديدة'}
                    </Button>
                </div>

                {showForm && <InvoiceForm customers={customers} editing={editing} onCancel={() => setShowForm(false)} />}

                {/* Customer filter */}
                <div className="flex flex-wrap items-center gap-2">
                    <Select
                        value={customerId || 'all'}
                        onValueChange={(v) => {
                            const val = v === 'all' ? '' : v;
                            setCustomerId(val);
                            applyFilters({ customer_id: val });
                        }}
                    >
                        <SelectTrigger className="h-9 w-56 text-sm">
                            <SelectValue placeholder="كل العملاء" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">كل العملاء</SelectItem>
                            {customers.map((c) => (
                                <SelectItem key={c.id} value={String(c.id)}>
                                    {c.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <div className="ms-auto text-xs text-muted-foreground">
                        {invoices.data.length} من {invoices.total} فاتورة
                    </div>
                </div>

                {/* Invoices list */}
                <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                    <div className="grid grid-cols-[1fr_1.5fr_2fr_1fr_1fr_auto] items-center gap-4 border-b bg-muted/30 px-5 py-3 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                        <span>الفاتورة</span>
                        <span>العميل</span>
                        <span>البيان</span>
                        <span className="text-end">المبلغ</span>
                        <span className="text-end">الحالة</span>
                        <span />
                    </div>

                    {invoices.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-4 py-20 text-muted-foreground">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/20">
                                <FileSpreadsheet className="h-7 w-7 opacity-30" />
                            </div>
                            <div className="text-center">
                                <p className="font-semibold">لا توجد فواتير</p>
                                <p className="mt-1 text-sm opacity-60">ابدأ بإصدار فاتورة جديدة</p>
                            </div>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {invoices.data.map((inv) => (
                                <div
                                    key={inv.id}
                                    className="grid grid-cols-[1fr_1.5fr_2fr_1fr_1fr_auto] items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/30"
                                >
                                    <div>
                                        <p className="font-mono text-sm font-semibold">{inv.invoice_number}</p>
                                        <p className="text-xs text-muted-foreground" dir="ltr">
                                            {inv.issued_date}
                                        </p>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium">{inv.customer_name}</p>
                                        {inv.motor_reference && <p className="truncate text-xs text-muted-foreground">قيد: {inv.motor_reference}</p>}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm">{inv.description}</p>
                                        {inv.notes && <p className="mt-0.5 truncate text-xs text-muted-foreground">{inv.notes}</p>}
                                    </div>
                                    <div className="text-end">
                                        <p className="font-mono text-sm font-bold">${fmt(inv.amount)}</p>
                                        {inv.paid > 0 && !inv.is_paid && <p className="text-xs text-muted-foreground">مدفوع: ${fmt(inv.paid)}</p>}
                                    </div>
                                    <div className="text-end">
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                'text-xs',
                                                inv.is_paid
                                                    ? 'border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950/40 dark:text-green-300'
                                                    : 'border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
                                            )}
                                        >
                                            {inv.is_paid ? 'مسدد' : `متبقي $${fmt(inv.remaining)}`}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => openEdit(inv)}
                                            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </button>
                                        {can('delete-invoices') && (
                                            <button
                                                type="button"
                                                onClick={() => setDeleteTarget(inv)}
                                                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {invoices.last_page > 1 && <PaginationLinks links={invoices.links} />}
            </Main>

            <AlertDialog
                open={!!deleteTarget}
                onOpenChange={(open) => {
                    if (!open) setDeleteTarget(null);
                }}
            >
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>تأكيد حذف الفاتورة</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-1">
                            <span>سيتم حذف الفاتورة </span>
                            <span className="font-semibold text-foreground">{deleteTarget?.invoice_number}</span>
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
