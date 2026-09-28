import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCan } from '@/hooks/use-can';
import { cn } from '@/lib/utils';
import { Link, router, useForm } from '@inertiajs/react';
import {
    ArrowRight,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Clock,
    CreditCard,
    Mail,
    MapPin,
    Package,
    Phone,
    Plus,
    ShoppingCart,
    Trash2,
    Truck,
    Wallet,
    Wrench,
} from 'lucide-react';
import { useState } from 'react';

/* ── types ── */
interface Part {
    id: number;
    part_name: string;
    type: string;
    type_label: string;
    quantity: number;
    unit_cost: number;
    total_cost: number;
    is_paid: boolean;
    motor_id: number | null;
    reference_number: string | null;
    received_at: string | null;
    created_at: string;
}
interface Purchase {
    id: number;
    part_name: string;
    part_type: string;
    quantity: number;
    unit_cost: number;
    total_cost: number;
    purchase_date: string;
    notes: string | null;
}
interface Payment {
    id: number;
    amount: number;
    payment_date: string;
    notes: string | null;
}
interface Supplier {
    id: number;
    name: string;
    address: string | null;
    phone: string | null;
    shop_phone: string | null;
    email: string | null;
    specialty: string | null;
    notes: string | null;
    created_at: string;
}
interface Summary {
    motor_parts_cost: number;
    direct_cost: number;
    total_owed: number;
    total_paid: number;
    remaining: number;
}
interface Props {
    supplier: Supplier;
    parts: Part[];
    purchases: Purchase[];
    payments: Payment[];
    summary: Summary;
}

const typeColors: Record<string, string> = {
    part: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    oil: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
    transport: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
    cleaning: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
    other: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
};
const typeLabels: Record<string, string> = {
    part: 'قطعة غيار',
    oil: 'زيوت',
    transport: 'نقل',
    cleaning: 'تنظيف',
    other: 'أخرى',
};

function fmt(n: number) {
    return n.toFixed(2);
}
function pct(paid: number, owed: number) {
    if (owed <= 0) return 100;
    return Math.min(100, Math.round((paid / owed) * 100));
}

/* ── shared input class ── */
const inputCls = [
    'flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm',
    'transition-colors placeholder:text-muted-foreground',
    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
].join(' ');

/* ── Field wrapper ── */
function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
                {label}
                {required && <span className="ms-0.5 text-destructive">*</span>}
            </label>
            {children}
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}

/* ── Stat card ── */
function StatCard({
    label,
    value,
    icon,
    ring,
    valueColor,
}: {
    label: string;
    value: string;
    icon: React.ReactNode;
    ring: string;
    valueColor?: string;
}) {
    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <p className="mb-1 truncate text-xs text-muted-foreground">{label}</p>
                        <p className={cn('font-mono text-lg leading-tight font-bold', valueColor)} dir="ltr">
                            {value}
                        </p>
                    </div>
                    <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', ring)}>{icon}</div>
                </div>
            </CardContent>
        </Card>
    );
}

/* ── Empty state ── */
function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground/60">
            <div className="[&_svg]:h-8 [&_svg]:w-8">{icon}</div>
            <p className="text-sm">{text}</p>
        </div>
    );
}

/* ── Section icon badge ── */
function SectionIcon({ icon, bg }: { icon: React.ReactNode; bg: string }) {
    return <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg [&_svg]:h-3.5 [&_svg]:w-3.5', bg)}>{icon}</div>;
}

/* ── Add Purchase Form ── */
function AddPurchaseForm({ supplierId, onClose }: { supplierId: number; onClose: () => void }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        part_name: '',
        part_type: 'part',
        quantity: '1',
        unit_cost: '',
        purchase_date: new Date().toISOString().split('T')[0],
        notes: '',
    });

    const total = parseFloat(data.quantity || '0') * parseFloat(data.unit_cost || '0');

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(`/suppliers/${supplierId}/purchases`, {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    }

    return (
        <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4">
            <p className="mb-3 text-[11px] font-semibold tracking-widest text-primary/70 uppercase">إضافة مشترى جديد</p>
            <form onSubmit={submit} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="اسم القطعة / المادة" required error={errors.part_name}>
                        <input
                            autoFocus
                            className={inputCls}
                            placeholder="مثال: مضخة زيت"
                            value={data.part_name}
                            onChange={(e) => setData('part_name', e.target.value)}
                        />
                    </Field>
                    <Field label="التصنيف">
                        <select className={inputCls} value={data.part_type} onChange={(e) => setData('part_type', e.target.value)}>
                            {Object.entries(typeLabels).map(([v, l]) => (
                                <option key={v} value={v}>
                                    {l}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="الكمية" required error={errors.quantity}>
                        <input
                            type="number"
                            min="0.001"
                            step="0.001"
                            className={inputCls}
                            value={data.quantity}
                            onChange={(e) => setData('quantity', e.target.value)}
                        />
                    </Field>
                    <Field label="سعر الوحدة ($)" required error={errors.unit_cost}>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            className={inputCls}
                            placeholder="0.00"
                            value={data.unit_cost}
                            onChange={(e) => setData('unit_cost', e.target.value)}
                        />
                    </Field>
                    <Field label="تاريخ الشراء" required>
                        <input
                            type="date"
                            className={inputCls}
                            value={data.purchase_date}
                            onChange={(e) => setData('purchase_date', e.target.value)}
                        />
                    </Field>
                    <Field label="ملاحظة">
                        <input className={inputCls} placeholder="اختياري..." value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                    </Field>
                </div>
                {data.quantity && data.unit_cost && (
                    <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2">
                        <span className="text-xs text-muted-foreground">الإجمالي التقديري:</span>
                        <span className="font-mono text-sm font-bold text-primary" dir="ltr">
                            $ {total.toFixed(2)}
                        </span>
                    </div>
                )}
                <div className="flex gap-2 pt-1">
                    <Button type="submit" size="sm" className="gap-2" disabled={processing}>
                        {processing ? (
                            <>
                                <Clock className="h-3.5 w-3.5 animate-spin" />
                                جاري الحفظ...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                تسجيل المشترى
                            </>
                        )}
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={onClose}>
                        إلغاء
                    </Button>
                </div>
            </form>
        </div>
    );
}

/* ── Add Payment Form ── */
function AddPaymentForm({ supplierId, onClose }: { supplierId: number; onClose: () => void }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        notes: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(`/suppliers/${supplierId}/payments`, {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    }

    return (
        <div className="rounded-xl border border-dashed border-green-400/60 bg-green-50/60 p-4 dark:bg-green-950/20">
            <p className="mb-3 text-[11px] font-semibold tracking-widest text-green-700/70 uppercase dark:text-green-400/70">تسجيل دفعة للمورد</p>
            <form onSubmit={submit} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="المبلغ ($)" required error={errors.amount}>
                        <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            className={inputCls}
                            placeholder="0.00"
                            value={data.amount}
                            onChange={(e) => setData('amount', e.target.value)}
                        />
                    </Field>
                    <Field label="التاريخ">
                        <input type="date" className={inputCls} value={data.payment_date} onChange={(e) => setData('payment_date', e.target.value)} />
                    </Field>
                    <Field label="ملاحظة">
                        <input className={inputCls} placeholder="اختياري..." value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                    </Field>
                </div>
                <div className="flex gap-2 pt-1">
                    <Button
                        type="submit"
                        size="sm"
                        className="gap-2 bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
                        disabled={processing}
                    >
                        {processing ? (
                            <>
                                <Clock className="h-3.5 w-3.5 animate-spin" />
                                جاري الحفظ...
                            </>
                        ) : (
                            <>
                                <Wallet className="h-3.5 w-3.5" />
                                تسجيل الدفعة
                            </>
                        )}
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={onClose}>
                        إلغاء
                    </Button>
                </div>
            </form>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   Main Component
══════════════════════════════════════════════════════════════ */
export default function SupplierShow({ supplier, parts, purchases, payments, summary }: Props) {
    const can = useCan();
    const [showPurchaseForm, setShowPurchaseForm] = useState(false);
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [showMotorParts, setShowMotorParts] = useState(false);
    const [deletePurchase, setDeletePurchase] = useState<Purchase | null>(null);
    const [deletePayment, setDeletePayment] = useState<Payment | null>(null);

    const settled = summary.remaining <= 0.009;
    const paidPct = pct(summary.total_paid, summary.total_owed);

    return (
        <>
            <Header fixed>
                <div className="flex flex-1 items-center gap-2">
                    <Link href="/suppliers">
                        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
                            <ArrowRight className="h-4 w-4" />
                            الموردون
                        </Button>
                    </Link>
                    <span className="text-muted-foreground/40">/</span>
                    <span className="truncate font-semibold">{supplier.name}</span>
                </div>
                <div className="ms-auto flex items-center gap-3">
                    <ThemeSwitch />
                    <ProfileDropdown />
                </div>
            </Header>

            {/* ── Dialogs ── */}
            <AlertDialog open={!!deletePurchase} onOpenChange={(o) => !o && setDeletePurchase(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>حذف المشترى</AlertDialogTitle>
                        <AlertDialogDescription>
                            هل أنت متأكد من حذف <strong>{deletePurchase?.part_name}</strong>؟ لا يمكن التراجع عن هذا الإجراء.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                            className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
                            onClick={() => {
                                router.delete(`/supplier-purchases/${deletePurchase!.id}`, { preserveScroll: true });
                                setDeletePurchase(null);
                            }}
                        >
                            حذف
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!deletePayment} onOpenChange={(o) => !o && setDeletePayment(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>حذف الدفعة</AlertDialogTitle>
                        <AlertDialogDescription>
                            سيتم حذف الدفعة بمبلغ <strong dir="ltr">$ {deletePayment ? fmt(deletePayment.amount) : ''}</strong> وإعادتها للصندوق
                            تلقائياً.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                            className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
                            onClick={() => {
                                router.delete(`/supplier-payments/${deletePayment!.id}`, { preserveScroll: true });
                                setDeletePayment(null);
                            }}
                        >
                            حذف وإعادة للصندوق
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Main className="flex flex-1 flex-col gap-5">
                {/* ── Supplier Hero ── */}
                <Card className="overflow-hidden">
                    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                        {/* Identity */}
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
                                <Truck className="h-7 w-7" />
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="text-xl font-bold">{supplier.name}</h1>
                                    {supplier.specialty && (
                                        <Badge variant="secondary" className="gap-1 text-xs">
                                            <Wrench className="h-3 w-3" />
                                            {supplier.specialty}
                                        </Badge>
                                    )}
                                </div>
                                <div className="mt-1 flex flex-col gap-0.5">
                                    {supplier.phone && (
                                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground" dir="ltr">
                                            <Phone className="h-3.5 w-3.5 shrink-0" />
                                            {supplier.phone}
                                        </span>
                                    )}
                                    {supplier.shop_phone && (
                                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground" dir="ltr">
                                            <Phone className="h-3.5 w-3.5 shrink-0" />
                                            {supplier.shop_phone}
                                            <span dir="rtl" className="text-xs text-muted-foreground/70">
                                                (المحل)
                                            </span>
                                        </span>
                                    )}
                                    {supplier.email && (
                                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                            <Mail className="h-3.5 w-3.5 shrink-0" />
                                            {supplier.email}
                                        </span>
                                    )}
                                    {supplier.address && (
                                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                                            {supplier.address}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        {/* Balance pill */}
                        <div
                            className={cn(
                                'flex items-center gap-3 rounded-xl border px-4 py-3',
                                settled
                                    ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30'
                                    : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30',
                            )}
                        >
                            <div
                                className={cn(
                                    'flex h-10 w-10 items-center justify-center rounded-full',
                                    settled ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50',
                                )}
                            >
                                {settled ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                ) : (
                                    <CreditCard className="h-5 w-5 text-red-600 dark:text-red-400" />
                                )}
                            </div>
                            <div>
                                <p
                                    className={cn(
                                        'text-xs font-medium',
                                        settled ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
                                    )}
                                >
                                    {settled ? 'الحساب مسدد' : 'رصيد مستحق'}
                                </p>
                                <p
                                    className={cn(
                                        'font-mono text-xl font-bold',
                                        settled ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400',
                                    )}
                                    dir="ltr"
                                >
                                    {settled ? '✓ مسدد' : `$ ${fmt(summary.remaining)}`}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Payment progress */}
                    {summary.total_owed > 0 && (
                        <div className="border-t bg-muted/20 px-5 py-3">
                            <div className="mb-1.5 flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">نسبة السداد</span>
                                <span className="text-xs font-semibold tabular-nums">{paidPct}%</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                    className={cn('h-full rounded-full transition-all duration-500', settled ? 'bg-green-500' : 'bg-primary')}
                                    style={{ width: `${paidPct}%` }}
                                />
                            </div>
                            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                                <span>
                                    مدفوع:{' '}
                                    <span className="font-mono font-semibold text-foreground" dir="ltr">
                                        $ {fmt(summary.total_paid)}
                                    </span>
                                </span>
                                <span>
                                    إجمالي المستحق:{' '}
                                    <span className="font-mono font-semibold text-foreground" dir="ltr">
                                        $ {fmt(summary.total_owed)}
                                    </span>
                                </span>
                            </div>
                        </div>
                    )}
                </Card>

                {/* ── Summary Stats ── */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <StatCard
                        label="قطع مرتبطة بقيود"
                        value={`$ ${fmt(summary.motor_parts_cost)}`}
                        icon={<Package className="h-4 w-4" />}
                        ring="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    />
                    <StatCard
                        label="مشتريات مباشرة"
                        value={`$ ${fmt(summary.direct_cost)}`}
                        icon={<ShoppingCart className="h-4 w-4" />}
                        ring="bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300"
                    />
                    <StatCard
                        label="إجمالي المستحق"
                        value={`$ ${fmt(summary.total_owed)}`}
                        icon={<CreditCard className="h-4 w-4" />}
                        ring="bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300"
                        valueColor="text-orange-600 dark:text-orange-400"
                    />
                    <StatCard
                        label="المدفوع للمورد"
                        value={`$ ${fmt(summary.total_paid)}`}
                        icon={<Wallet className="h-4 w-4" />}
                        ring="bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-300"
                        valueColor="text-green-600 dark:text-green-400"
                    />
                </div>

                {/* ── Two-column: Purchases + Payments ── */}
                <div className="grid gap-5 xl:grid-cols-2">
                    {/* Purchases */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <SectionIcon icon={<ShoppingCart />} bg="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" />
                                    مشتريات مباشرة
                                    {purchases.length > 0 && (
                                        <Badge variant="secondary" className="font-mono text-xs">
                                            {purchases.length}
                                        </Badge>
                                    )}
                                </CardTitle>
                                <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => setShowPurchaseForm((v) => !v)}>
                                    <Plus className="h-3.5 w-3.5" />
                                    إضافة
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {showPurchaseForm && <AddPurchaseForm supplierId={supplier.id} onClose={() => setShowPurchaseForm(false)} />}
                            {purchases.length === 0 && !showPurchaseForm ? (
                                <EmptyState icon={<ShoppingCart />} text="لا توجد مشتريات مباشرة مسجلة" />
                            ) : (
                                purchases.length > 0 && (
                                    <div className="overflow-x-auto rounded-lg border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                                    <TableHead className="text-right text-xs font-semibold">القطعة / المادة</TableHead>
                                                    <TableHead className="text-right text-xs font-semibold">النوع</TableHead>
                                                    <TableHead className="w-28 text-right text-xs font-semibold">الإجمالي</TableHead>
                                                    <TableHead className="w-24 text-right text-xs font-semibold">التاريخ</TableHead>
                                                    <TableHead className="w-9" />
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {purchases.map((p) => (
                                                    <TableRow key={p.id} className="group">
                                                        <TableCell>
                                                            <p className="text-sm leading-snug font-medium">{p.part_name}</p>
                                                            <p className="text-xs text-muted-foreground" dir="ltr">
                                                                {Number(p.quantity) % 1 === 0
                                                                    ? Number(p.quantity).toFixed(0)
                                                                    : Number(p.quantity).toFixed(3)}{' '}
                                                                × $ {fmt(p.unit_cost)}
                                                            </p>
                                                            {p.notes && <p className="mt-0.5 text-xs text-muted-foreground/70">{p.notes}</p>}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className={cn('text-xs', typeColors[p.part_type] ?? '')}>
                                                                {typeLabels[p.part_type] ?? p.part_type}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="font-mono text-sm font-semibold" dir="ltr">
                                                            $ {fmt(p.total_cost)}
                                                        </TableCell>
                                                        <TableCell className="text-xs text-muted-foreground" dir="ltr">
                                                            {p.purchase_date}
                                                        </TableCell>
                                                        <TableCell>
                                                            {can('delete-suppliers') && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                                                                    onClick={() => setDeletePurchase(p)}
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                            {purchases.length > 1 && (
                                                <tfoot className="border-t-2 bg-muted/30">
                                                    <tr>
                                                        <td colSpan={2} className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">
                                                            المجموع — {purchases.length} عنصر
                                                        </td>
                                                        <td className="px-4 py-2.5 font-mono text-sm font-bold" dir="ltr">
                                                            $ {fmt(summary.direct_cost)}
                                                        </td>
                                                        <td colSpan={2} />
                                                    </tr>
                                                </tfoot>
                                            )}
                                        </Table>
                                    </div>
                                )
                            )}
                        </CardContent>
                    </Card>

                    {/* Payments */}
                    <Card className="border-green-200/80 dark:border-green-900/60">
                        <CardHeader className="pb-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <SectionIcon icon={<Wallet />} bg="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" />
                                    الدفعات للمورد
                                    {payments.length > 0 && (
                                        <Badge variant="secondary" className="font-mono text-xs">
                                            {payments.length}
                                        </Badge>
                                    )}
                                </CardTitle>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 gap-1.5 border-green-300 text-xs text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950/30"
                                    onClick={() => setShowPaymentForm((v) => !v)}
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    دفعة جديدة
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {showPaymentForm && <AddPaymentForm supplierId={supplier.id} onClose={() => setShowPaymentForm(false)} />}
                            {payments.length === 0 && !showPaymentForm ? (
                                <EmptyState icon={<Wallet />} text="لا توجد دفعات مسجلة" />
                            ) : (
                                payments.length > 0 && (
                                    <div className="overflow-x-auto rounded-lg border border-green-100 dark:border-green-900/40">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-green-50/80 hover:bg-green-50/80 dark:bg-green-950/20 dark:hover:bg-green-950/20">
                                                    <TableHead className="text-right text-xs font-semibold">ملاحظة</TableHead>
                                                    <TableHead className="w-24 text-right text-xs font-semibold">التاريخ</TableHead>
                                                    <TableHead className="w-32 text-right text-xs font-semibold">المبلغ</TableHead>
                                                    <TableHead className="w-9" />
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {payments.map((p) => (
                                                    <TableRow key={p.id} className="group">
                                                        <TableCell className="text-sm text-muted-foreground">
                                                            {p.notes ?? <span className="text-xs text-muted-foreground/40">—</span>}
                                                        </TableCell>
                                                        <TableCell className="text-xs text-muted-foreground" dir="ltr">
                                                            {p.payment_date}
                                                        </TableCell>
                                                        <TableCell
                                                            className="font-mono text-sm font-semibold text-green-700 dark:text-green-400"
                                                            dir="ltr"
                                                        >
                                                            $ {fmt(p.amount)}
                                                        </TableCell>
                                                        <TableCell>
                                                            {can('delete-suppliers') && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                                                                    onClick={() => setDeletePayment(p)}
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                            {payments.length > 1 && (
                                                <tfoot className="border-t-2 border-green-100 bg-green-50/50 dark:border-green-900/40 dark:bg-green-950/10">
                                                    <tr>
                                                        <td colSpan={2} className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">
                                                            المجموع — {payments.length} دفعة
                                                        </td>
                                                        <td
                                                            className="px-4 py-2.5 font-mono text-sm font-bold text-green-700 dark:text-green-400"
                                                            dir="ltr"
                                                        >
                                                            $ {fmt(summary.total_paid)}
                                                        </td>
                                                        <td />
                                                    </tr>
                                                </tfoot>
                                            )}
                                        </Table>
                                    </div>
                                )
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ── Motor-linked Parts (collapsible) ── */}
                <Card>
                    <CardHeader className="pb-3">
                        <button
                            type="button"
                            className="flex w-full items-center justify-between gap-2 text-start"
                            onClick={() => setShowMotorParts((v) => !v)}
                        >
                            <CardTitle className="flex items-center gap-2 text-base">
                                <SectionIcon icon={<Package />} bg="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" />
                                قطع مرتبطة بقيود الاستلام
                                {parts.length > 0 && (
                                    <Badge variant="secondary" className="font-mono text-xs">
                                        {parts.length}
                                    </Badge>
                                )}
                            </CardTitle>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <span className="font-mono text-sm font-semibold text-foreground" dir="ltr">
                                    $ {fmt(summary.motor_parts_cost)}
                                </span>
                                {showMotorParts ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </div>
                        </button>
                    </CardHeader>

                    {showMotorParts && (
                        <CardContent className="overflow-x-auto border-t p-0">
                            {parts.length === 0 ? (
                                <div className="p-5">
                                    <EmptyState icon={<Package />} text="لا توجد قطع مرتبطة بقيود" />
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                                            <TableHead className="text-right text-xs font-semibold">القطعة</TableHead>
                                            <TableHead className="text-right text-xs font-semibold">النوع</TableHead>
                                            <TableHead className="w-16 text-right text-xs font-semibold">الكمية</TableHead>
                                            <TableHead className="w-28 text-right text-xs font-semibold">سعر الوحدة</TableHead>
                                            <TableHead className="w-28 text-right text-xs font-semibold">الإجمالي</TableHead>
                                            <TableHead className="text-right text-xs font-semibold">رقم القيد</TableHead>
                                            <TableHead className="w-24 text-right text-xs font-semibold">تاريخ الاستلام</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {parts.map((p) => (
                                            <TableRow key={p.id}>
                                                <TableCell className="text-sm font-medium">{p.part_name}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={cn('text-xs', typeColors[p.type] ?? '')}>
                                                        {p.type_label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm tabular-nums">
                                                    {p.quantity % 1 === 0 ? p.quantity.toFixed(0) : p.quantity.toFixed(3)}
                                                </TableCell>
                                                <TableCell className="font-mono text-sm text-muted-foreground" dir="ltr">
                                                    $ {fmt(p.unit_cost)}
                                                </TableCell>
                                                <TableCell className="font-mono text-sm font-semibold" dir="ltr">
                                                    $ {fmt(p.total_cost)}
                                                </TableCell>
                                                <TableCell>
                                                    {p.motor_id ? (
                                                        <Link
                                                            href={`/motors/${p.motor_id}`}
                                                            className="font-mono text-xs font-semibold text-primary underline-offset-4 hover:underline"
                                                        >
                                                            {p.reference_number ?? '—'}
                                                        </Link>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground" dir="ltr">
                                                    {p.received_at ?? p.created_at}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                    {parts.length > 1 && (
                                        <tfoot className="border-t-2 bg-muted/30">
                                            <tr>
                                                <td colSpan={4} className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">
                                                    المجموع — {parts.length} قطعة
                                                </td>
                                                <td className="px-4 py-2.5 font-mono text-sm font-bold" dir="ltr">
                                                    $ {fmt(summary.motor_parts_cost)}
                                                </td>
                                                <td colSpan={2} />
                                            </tr>
                                        </tfoot>
                                    )}
                                </Table>
                            )}
                        </CardContent>
                    )}
                </Card>

                {supplier.notes && (
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-muted-foreground">ملاحظات</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm leading-relaxed">{supplier.notes}</p>
                        </CardContent>
                    </Card>
                )}
            </Main>
        </>
    );
}
