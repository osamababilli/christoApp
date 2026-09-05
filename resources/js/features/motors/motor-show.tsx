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
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCan } from '@/hooks/use-can';
import { cn } from '@/lib/utils';
import { Link, router, useForm } from '@inertiajs/react';
import {
    ArrowRight,
    Calendar,
    CalendarCheck,
    Car,
    CheckCircle2,
    Clock,
    DollarSign,
    FileText,
    Lock,
    Package,
    Pencil,
    Phone,
    Plus,
    Printer,
    Trash2,
    User,
    Wallet,
    Wrench,
} from 'lucide-react';

import { useState } from 'react';
import { MaintenanceOrderForm } from '../maintenance/maintenance-order-form';
import { PartForm } from '../parts/part-form';

interface Transaction {
    id: number;
    type: 'payment' | 'discount';
    type_label: string;
    amount: number;
    payment_method: 'cash' | 'whish' | 'omt' | null;
    payment_method_label: string | null;
    account_name: string | null;
    notes: string | null;
    transaction_date: string;
}

interface Part {
    id: number;
    part_name: string;
    type: string;
    type_label: string;
    quantity: number;
    unit_cost: number;
    unit_price: number;
    total_cost: number;
    is_paid: boolean;
    purchased_by: 'customer' | 'company';
    supplier_name: string | null;
}

interface ReceivedItem {
    id: number;
    item_name: string;
    quantity: number;
}

interface MaintenanceOrder {
    id: number;
    stage: number;
    description: string;
    started_at: string;
    completed_at: string | null;
    labor_cost: number;
    status: string;
    status_label: string;
    stop_reason: string | null;
    parts: Part[];
}

interface Motor {
    id: number;
    reference_number: string;
    customer: { id: number; name: string; phone: string; account_type: 'direct' | 'account' };
    status: string;
    status_label: string;
    notes: string | null;
    received_at: string;
    delivered_at: string | null;
    category_name: string | null;
    assigned_to_name: string | null;
    received_by_name: string | null;
    received_items: ReceivedItem[];
    transactions: Transaction[];
    maintenance_orders: MaintenanceOrder[];
}

interface SupplierOption {
    id: number;
    name: string;
}

interface Props {
    motor: Motor;
    suppliers: SupplierOption[];
}

const statusConfig: Record<string, { color: string; bar: string; active: string; dot: string }> = {
    in_workshop: {
        color: 'border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:border-blue-700 dark:text-blue-300',
        bar: 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900',
        active: 'ring-2 ring-blue-400',
        dot: 'bg-blue-500',
    },
    in_progress: {
        color: 'border-yellow-300 bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:border-yellow-700 dark:text-yellow-300',
        bar: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-900',
        active: 'ring-2 ring-yellow-400',
        dot: 'bg-yellow-500',
    },
    ready: {
        color: 'border-green-300 bg-green-50 text-green-700 dark:bg-green-950/40 dark:border-green-700 dark:text-green-300',
        bar: 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900',
        active: 'ring-2 ring-green-400',
        dot: 'bg-green-500',
    },
    delivered: {
        color: 'border-gray-300 bg-gray-50 text-gray-600 dark:bg-gray-800/40 dark:border-gray-600 dark:text-gray-300',
        bar: 'bg-gray-50 border-gray-200 dark:bg-gray-800/20 dark:border-gray-800',
        active: 'ring-2 ring-gray-400',
        dot: 'bg-gray-400',
    },
};

const maintenanceStatusConfig: Record<string, { badge: string; border: string; label: string; color: string; active: string }> = {
    in_progress: {
        badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        border: 'border-r-yellow-400',
        label: 'قيد التنفيذ',
        color: 'border-yellow-300 bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:border-yellow-700 dark:text-yellow-300',
        active: 'ring-2 ring-yellow-400',
    },
    completed: {
        badge: 'bg-green-100 text-green-800 border-green-200',
        border: 'border-r-green-400',
        label: 'مكتمل',
        color: 'border-green-300 bg-green-50 text-green-700 dark:bg-green-950/40 dark:border-green-700 dark:text-green-300',
        active: 'ring-2 ring-green-400',
    },
    on_hold: {
        badge: 'bg-red-100 text-red-800 border-red-200',
        border: 'border-r-red-400',
        label: 'موقوف',
        color: 'border-red-300 bg-red-50 text-red-700 dark:bg-red-950/40 dark:border-red-700 dark:text-red-300',
        active: 'ring-2 ring-red-400',
    },
};

const maintenanceSteps = ['in_progress', 'completed', 'on_hold'] as const;

function MaintenanceStatusBar({ order }: { order: MaintenanceOrder }) {
    const [updating, setUpdating] = useState(false);
    const [showStopReason, setShowStopReason] = useState(false);
    const [stopReason, setStopReason] = useState(order.stop_reason ?? '');

    function updateStatus(status: string) {
        if (status === 'on_hold') {
            setShowStopReason(true);
            return;
        }
        setShowStopReason(false);
        setUpdating(true);
        router.patch(
            `/maintenance/${order.id}/status`,
            { status },
            {
                preserveScroll: true,
                onFinish: () => setUpdating(false),
            },
        );
    }

    function submitOnHold() {
        setUpdating(true);
        router.patch(
            `/maintenance/${order.id}/status`,
            { status: 'on_hold', stop_reason: stopReason },
            {
                preserveScroll: true,
                onFinish: () => {
                    setUpdating(false);
                    setShowStopReason(false);
                },
            },
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
                {maintenanceSteps.map((s) => {
                    const cfg = maintenanceStatusConfig[s];
                    const isCurrent = order.status === s;
                    return (
                        <button
                            key={s}
                            type="button"
                            disabled={updating || isCurrent}
                            onClick={() => updateStatus(s)}
                            className={cn(
                                'rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all',
                                cfg.color,
                                isCurrent ? cn(cfg.active, 'cursor-default') : 'cursor-pointer opacity-60 hover:opacity-100',
                            )}
                        >
                            {isCurrent && <span className="me-1">✓</span>}
                            {cfg.label}
                        </button>
                    );
                })}
            </div>
            {showStopReason && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2 dark:border-red-900 dark:bg-red-950/20">
                    <input
                        autoFocus
                        className="min-h-[36px] flex-1 rounded-md border bg-white px-3 text-sm dark:bg-background"
                        placeholder="سبب التوقف..."
                        value={stopReason}
                        onChange={(e) => setStopReason(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && submitOnHold()}
                    />
                    <Button size="sm" variant="destructive" disabled={updating} onClick={submitOnHold} className="shrink-0">
                        تأكيد
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowStopReason(false)} className="shrink-0">
                        إلغاء
                    </Button>
                </div>
            )}
        </div>
    );
}

const statusSteps = [
    { value: 'in_workshop', label: 'في الورشة' },
    { value: 'in_progress', label: 'قيد الإصلاح' },
    { value: 'ready', label: 'جاهز للاستلام' },
    { value: 'delivered', label: 'تم التسليم' },
];

function StatusUpdateBar({ motor }: { motor: Motor }) {
    const [updating, setUpdating] = useState(false);
    return (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {statusSteps.map((s) => {
                const cfg = statusConfig[s.value];
                const isCurrent = motor.status === s.value;
                return (
                    <button
                        key={s.value}
                        type="button"
                        disabled={updating || isCurrent}
                        onClick={() => {
                            setUpdating(true);
                            router.patch(
                                `/motors/${motor.id}/status`,
                                { status: s.value },
                                {
                                    onFinish: () => setUpdating(false),
                                },
                            );
                        }}
                        className={cn(
                            'rounded-lg border px-3 py-2.5 text-sm font-semibold transition-all',
                            cfg.color,
                            isCurrent ? cn(cfg.active, 'cursor-default opacity-100') : 'cursor-pointer opacity-60 hover:opacity-90',
                        )}
                    >
                        {isCurrent && <span className="me-1.5">✓</span>}
                        {s.label}
                    </button>
                );
            })}
        </div>
    );
}

function PartsSection({
    order,
    suppliers,
    onDeletePart,
    isLocked,
}: {
    order: MaintenanceOrder;
    suppliers: SupplierOption[];
    onDeletePart: (id: number, name: string) => void;
    isLocked: boolean;
}) {
    const can = useCan();
    const [showForm, setShowForm] = useState(false);
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">القطع والمستلزمات ({order.parts.length})</p>
                {!isLocked && (
                    <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => setShowForm(!showForm)}>
                        <Plus className="h-3.5 w-3.5" />
                        إضافة قطعة
                    </Button>
                )}
            </div>

            {showForm && (
                <div className="rounded-lg border border-dashed bg-muted/30 p-4">
                    <PartForm maintenanceId={order.id} suppliers={suppliers} onCancel={() => setShowForm(false)} />
                </div>
            )}

            {order.parts.length > 0 && (
                <div className="overflow-x-auto rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/40">
                                <TableHead className="text-right text-xs">القطعة</TableHead>
                                <TableHead className="text-right text-xs">جهة الشراء</TableHead>
                                <TableHead className="text-right text-xs">الكمية</TableHead>
                                <TableHead className="text-right text-xs">سعر الشراء</TableHead>
                                <TableHead className="text-right text-xs">سعر البيع</TableHead>
                                <TableHead className="text-right text-xs">الإجمالي</TableHead>
                                <TableHead className="text-right text-xs">مدفوع</TableHead>
                                <TableHead className="w-8" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {order.parts.map((part) => {
                                const isCompany = part.purchased_by === 'company';
                                return (
                                    <TableRow key={part.id}>
                                        <TableCell className="text-sm font-medium">{part.part_name}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    'text-xs',
                                                    isCompany
                                                        ? 'border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
                                                        : 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
                                                )}
                                            >
                                                {isCompany ? 'الشركة' : 'العميل'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm">{Number(part.quantity)}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {isCompany ? Number(part.unit_cost).toFixed(2) : <span className="text-muted-foreground">—</span>}
                                        </TableCell>
                                        <TableCell className="text-sm font-medium">
                                            {isCompany ? (
                                                <span className="text-purple-700 dark:text-purple-400">{Number(part.unit_price).toFixed(2)}</span>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm font-semibold">
                                            {isCompany ? Number(part.total_cost).toFixed(2) : <span className="text-muted-foreground">—</span>}
                                        </TableCell>
                                        <TableCell>
                                            {part.purchased_by === 'customer' ? (
                                                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">العميل يجلبها</span>
                                            ) : part.is_paid ? (
                                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                            ) : (
                                                <Clock className="h-4 w-4 text-orange-500" />
                                            )}
                                        </TableCell>
                                        {!isLocked && (
                                            <TableCell>
                                                {can('delete-parts') && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-destructive hover:text-destructive"
                                                        onClick={() => onDeletePart(part.id, part.part_name)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        )}
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}

const paymentTypeConfig = {
    payment: {
        label: 'دفعة',
        color: 'border-green-300 bg-green-50 text-green-700 dark:bg-green-950/40 dark:border-green-700 dark:text-green-300',
        active: 'ring-2 ring-green-400',
    },
    discount: {
        label: 'خصم',
        color: 'border-purple-300 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:border-purple-700 dark:text-purple-300',
        active: 'ring-2 ring-purple-400',
    },
};

function PaymentsSection({ motor, grandTotal, isLocked }: { motor: Motor; grandTotal: number; isLocked: boolean }) {
    const can = useCan();
    const [showForm, setShowForm] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        type: 'payment' as 'payment' | 'discount',
        amount: '',
        payment_method: 'cash' as 'cash' | 'whish' | 'omt',
        account_name: '',
        notes: '',
        transaction_date: new Date().toISOString().split('T')[0],
    });

    const totalPaid = motor.transactions.filter((t) => t.type === 'payment').reduce((s, t) => s + t.amount, 0);
    const totalDiscount = motor.transactions.filter((t) => t.type === 'discount').reduce((s, t) => s + t.amount, 0);
    const totalCredited = totalPaid + totalDiscount;
    const remaining = grandTotal - totalCredited;

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(`/motors/${motor.id}/transactions`, {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setShowForm(false);
            },
        });
    }

    function confirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/transactions/${deleteTarget.id}`, { preserveScroll: true });
        setDeleteTarget(null);
    }

    return (
        <>
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Wallet className="h-4 w-4 text-muted-foreground" />
                            كشف الحساب
                        </CardTitle>
                        {!isLocked && (
                            <Button size="sm" className="gap-1.5" onClick={() => setShowForm(!showForm)}>
                                <Plus className="h-3.5 w-3.5" />
                                إضافة دفعة
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Summary */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-xl border bg-muted/40 px-4 py-3">
                            <p className="text-xs text-muted-foreground">إجمالي الفاتورة</p>
                            <p className="mt-0.5 text-lg font-bold">{grandTotal.toFixed(2)}</p>
                        </div>
                        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 dark:border-green-900 dark:bg-green-950/30">
                            <p className="text-xs text-green-700 dark:text-green-400">المدفوع</p>
                            <p className="mt-0.5 text-lg font-bold text-green-700 dark:text-green-400">{totalCredited.toFixed(2)}</p>
                        </div>
                        <div
                            className={cn(
                                'rounded-xl border px-4 py-3',
                                remaining <= 0
                                    ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30'
                                    : 'border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/30',
                            )}
                        >
                            <p
                                className={cn(
                                    'text-xs',
                                    remaining <= 0 ? 'text-green-700 dark:text-green-400' : 'text-orange-700 dark:text-orange-400',
                                )}
                            >
                                المتبقي
                            </p>
                            <p
                                className={cn(
                                    'mt-0.5 text-lg font-bold',
                                    remaining <= 0 ? 'text-green-700 dark:text-green-400' : 'text-orange-700 dark:text-orange-400',
                                )}
                            >
                                {remaining <= 0 ? '✓ مسدد' : remaining.toFixed(2)}
                            </p>
                        </div>
                    </div>

                    {/* Add payment form */}
                    {showForm && (
                        <div className="space-y-3 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4">
                            <form onSubmit={submit} className="space-y-3">
                                {/* Type chips */}
                                <div className="flex gap-2">
                                    {(Object.entries(paymentTypeConfig) as [string, typeof paymentTypeConfig.payment][]).map(([val, cfg]) => (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => setData('type', val as 'payment' | 'discount')}
                                            className={cn(
                                                'cursor-pointer rounded-lg border px-4 py-1.5 text-sm font-semibold transition-all',
                                                cfg.color,
                                                data.type === val && cfg.active,
                                            )}
                                        >
                                            {data.type === val && <span className="me-1">✓</span>}
                                            {cfg.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="grid gap-3 sm:grid-cols-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground">
                                            المبلغ <span className="text-destructive">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            className="flex h-9 w-full rounded-md border bg-background px-3 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                            placeholder="0.00"
                                            value={data.amount}
                                            onChange={(e) => setData('amount', e.target.value)}
                                        />
                                        {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground">التاريخ</label>
                                        <input
                                            type="date"
                                            className="flex h-9 w-full rounded-md border bg-background px-3 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                            value={data.transaction_date}
                                            onChange={(e) => setData('transaction_date', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground">ملاحظة</label>
                                        <input
                                            type="text"
                                            className="flex h-9 w-full rounded-md border bg-background px-3 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                            placeholder="اختياري..."
                                            value={data.notes}
                                            onChange={(e) => setData('notes', e.target.value)}
                                        />
                                    </div>
                                </div>

                                {data.type === 'payment' && (
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-muted-foreground">طريقة الدفع</label>
                                            <div className="grid grid-cols-3 gap-1.5">
                                                {(
                                                    [
                                                        { value: 'cash', label: 'نقدًا' },
                                                        { value: 'whish', label: 'Whish' },
                                                        { value: 'omt', label: 'OMT' },
                                                    ] as const
                                                ).map((opt) => (
                                                    <button
                                                        key={opt.value}
                                                        type="button"
                                                        onClick={() => setData('payment_method', opt.value)}
                                                        className={cn(
                                                            'cursor-pointer rounded-lg border px-2 py-1.5 text-xs font-semibold transition-all',
                                                            data.payment_method === opt.value
                                                                ? 'border-green-400 bg-green-50 text-green-700 ring-2 ring-green-400 dark:border-green-700 dark:bg-green-950/40 dark:text-green-300'
                                                                : 'border-muted bg-muted/20 text-muted-foreground hover:bg-muted/50',
                                                        )}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-muted-foreground">الحساب المستلم</label>
                                            <input
                                                type="text"
                                                className="flex h-9 w-full rounded-md border bg-background px-3 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                                placeholder="مثال: صندوق الورشة..."
                                                value={data.account_name}
                                                onChange={(e) => setData('account_name', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <Button type="submit" size="sm" className="flex-1 gap-2" disabled={processing}>
                                        {processing ? (
                                            <>
                                                <Clock className="h-3.5 w-3.5 animate-spin" /> جاري الحفظ...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="h-3.5 w-3.5" /> تسجيل
                                            </>
                                        )}
                                    </Button>
                                    <Button type="button" variant="outline" size="sm" className="px-5" onClick={() => setShowForm(false)}>
                                        إلغاء
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Transactions list */}
                    {motor.transactions.length > 0 && (
                        <div className="overflow-x-auto rounded-lg border">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/40">
                                        <TableHead className="text-right text-xs">التاريخ</TableHead>
                                        <TableHead className="text-right text-xs">النوع</TableHead>
                                        <TableHead className="text-right text-xs">الطريقة</TableHead>
                                        <TableHead className="text-right text-xs">ملاحظة</TableHead>
                                        <TableHead className="text-right text-xs">المبلغ</TableHead>
                                        <TableHead className="w-8" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {motor.transactions.map((t) => (
                                        <TableRow key={t.id}>
                                            <TableCell className="text-sm text-muted-foreground">{t.transaction_date}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        'text-xs',
                                                        t.type === 'payment'
                                                            ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300'
                                                            : 'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300',
                                                    )}
                                                >
                                                    {t.type_label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {t.payment_method_label
                                                    ? `${t.payment_method_label}${t.account_name ? ` — ${t.account_name}` : ''}`
                                                    : '—'}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{t.notes ?? '—'}</TableCell>
                                            <TableCell className="text-sm font-semibold">{t.amount.toFixed(2)}</TableCell>
                                            {!isLocked && (
                                                <TableCell>
                                                    {can('delete-payments') && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-destructive hover:text-destructive"
                                                            onClick={() => setDeleteTarget(t)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {motor.transactions.length === 0 && !showForm && (
                        <p className="py-4 text-center text-sm text-muted-foreground">لا توجد دفعات مسجلة</p>
                    )}
                </CardContent>
            </Card>

            {/* Delete transaction confirmation */}
            <AlertDialog
                open={!!deleteTarget}
                onOpenChange={(open) => {
                    if (!open) setDeleteTarget(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                        <AlertDialogDescription>
                            سيتم حذف {deleteTarget?.type_label} بمبلغ{' '}
                            <span className="font-bold text-foreground">{deleteTarget?.amount.toFixed(2)}</span>.
                            <br />
                            هذا الإجراء لا يمكن التراجع عنه.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction className="text-destructive-foreground bg-destructive hover:bg-destructive/90" onClick={confirmDelete}>
                            نعم، احذف
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

export function MotorShow({ motor, suppliers }: Props) {
    const can = useCan();
    const [showAddMaintenance, setShowAddMaintenance] = useState(false);
    const [deleteMaintenanceTarget, setDeleteMaintenanceTarget] = useState<MaintenanceOrder | null>(null);
    const [deletePartTarget, setDeletePartTarget] = useState<{ id: number; part_name: string } | null>(null);

    const isAccountCustomer = motor.customer.account_type === 'account';
    const totalLabor = motor.maintenance_orders.reduce((s, o) => s + Number(o.labor_cost), 0);
    const totalParts = motor.maintenance_orders.flatMap((o) => o.parts).reduce((s, p) => s + Number(p.total_cost), 0);
    const grandTotal = totalLabor + totalParts;
    const totalCredited = motor.transactions.reduce((s, t) => s + t.amount, 0);
    const remaining = grandTotal - totalCredited;
    const isLocked = motor.status === 'delivered' && (isAccountCustomer || remaining <= 0.009);

    function deleteMaintenance(id: number) {
        const order = motor.maintenance_orders.find((o) => o.id === id);
        if (order) setDeleteMaintenanceTarget(order);
    }

    function deletePart(id: number, name: string) {
        setDeletePartTarget({ id, part_name: name });
    }

    function confirmDeleteMaintenance() {
        if (!deleteMaintenanceTarget) return;
        router.delete(`/maintenance/${deleteMaintenanceTarget.id}`, { preserveScroll: true });
        setDeleteMaintenanceTarget(null);
    }

    function confirmDeletePart() {
        if (!deletePartTarget) return;
        router.delete(`/parts/${deletePartTarget.id}`, { preserveScroll: true });
        setDeletePartTarget(null);
    }

    const cfg = statusConfig[motor.status] ?? statusConfig.in_workshop;

    return (
        <>
            <Header>
                <Link href="/motors">
                    <Button variant="ghost" size="sm" className="gap-2">
                        <ArrowRight className="h-4 w-4" />
                        العودة للقائمة
                    </Button>
                </Link>
                <div className="ms-auto flex items-center gap-3">
                    <ThemeSwitch />
                    <ProfileDropdown />
                </div>
            </Header>

            <Main className="flex flex-col gap-6 pb-10">
                {/* ── Hero ── */}
                <div className={cn('rounded-xl border p-6', cfg.bar)}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="font-mono text-3xl font-bold tracking-wide">{motor.reference_number}</h1>
                                <Badge variant="outline" className={cn('px-3 py-1 text-sm font-semibold', cfg.color)}>
                                    <span className={cn('me-1.5 inline-block h-2 w-2 rounded-full', cfg.dot)} />
                                    {motor.status_label}
                                </Badge>
                            </div>

                            <div className="flex flex-wrap gap-5 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                    <User className="h-4 w-4" />
                                    <span className="font-medium text-foreground">{motor.customer.name}</span>
                                </span>
                                <span className="flex items-center gap-1.5" dir="ltr">
                                    <Phone className="h-4 w-4" />
                                    {motor.customer.phone}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="h-4 w-4" />
                                    استُلم: {motor.received_at}
                                </span>
                                {motor.delivered_at && (
                                    <span className="flex items-center gap-1.5">
                                        <CalendarCheck className="h-4 w-4" />
                                        سُلِّم: {motor.delivered_at}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <a href={`/motors/${motor.id}/print`} target="_blank" rel="noreferrer">
                                <Button variant="outline" size="sm" className="gap-2">
                                    <Printer className="h-4 w-4" />
                                    فاتورة
                                </Button>
                            </a>
                            <a href={`/motors/${motor.id}/print/delivery`} target="_blank" rel="noreferrer">
                                <Button variant="outline" size="sm" className="gap-2">
                                    <FileText className="h-4 w-4" />
                                    ورقة تسليم
                                </Button>
                            </a>
                            {!isLocked && (
                                <Link href={`/motors/${motor.id}/edit`}>
                                    <Button size="sm" className="gap-2">
                                        <Pencil className="h-4 w-4" />
                                        تعديل
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Locked banner ── */}
                {isLocked && (
                    <div className="flex items-center gap-3 rounded-xl border border-green-300 bg-green-50 px-5 py-3 dark:border-green-800 dark:bg-green-950/30">
                        <Lock className="h-5 w-5 shrink-0 text-green-700 dark:text-green-400" />
                        <div>
                            <p className="font-semibold text-green-800 dark:text-green-300">ملف مغلق</p>
                            <p className="text-sm text-green-700/80 dark:text-green-400/80">
                                تم تسليم قيد الاستلام وسداد الفاتورة بالكامل — لا يمكن إجراء أي تعديلات.
                            </p>
                        </div>
                    </div>
                )}

                {/* ── Status update ── */}
                {!isLocked && (
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base text-muted-foreground">تحديث الحالة</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <StatusUpdateBar motor={motor} />
                        </CardContent>
                    </Card>
                )}

                {/* ── Info + Finance row ── */}
                <div className="grid gap-6 lg:grid-cols-5">
                    {/* Motor details — 3 cols */}
                    <Card className="lg:col-span-3">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Car className="h-4 w-4 text-muted-foreground" />
                                بيانات قيد الاستلام
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <dl className="divide-y">
                                {[
                                    { label: 'التصنيف', value: motor.category_name },
                                    { label: 'تاريخ الاستلام', value: motor.received_at },
                                    { label: 'تاريخ التسليم', value: motor.delivered_at },
                                    { label: 'المستلم', value: motor.received_by_name },
                                ]
                                    .filter((r) => r.value)
                                    .map((row) => (
                                        <div key={row.label} className="flex items-center justify-between py-2.5 text-sm">
                                            <dt className="text-muted-foreground">{row.label}</dt>
                                            <dd className="font-medium">{row.value}</dd>
                                        </div>
                                    ))}
                            </dl>
                            {motor.received_items.length > 0 && (
                                <>
                                    <Separator className="my-3" />
                                    <div className="space-y-2">
                                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <Package className="h-3.5 w-3.5" /> القطع المستلمة
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {motor.received_items.map((ri) => (
                                                <Badge key={ri.id} variant="secondary" className="gap-1 text-xs font-medium">
                                                    {ri.item_name}
                                                    <span className="text-muted-foreground">× {ri.quantity}</span>
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                            {motor.notes && (
                                <>
                                    <Separator className="my-3" />
                                    <div className="space-y-1">
                                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <FileText className="h-3.5 w-3.5" /> ملاحظات
                                        </p>
                                        <p className="text-sm leading-relaxed">{motor.notes}</p>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Financial summary — 2 cols */}
                    <Card className="lg:col-span-2">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                الملخص المالي
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                                <span className="text-sm text-muted-foreground">تكلفة القطع</span>
                                <span className="font-semibold">{totalParts.toFixed(2)}</span>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between rounded-lg border-2 border-primary/20 bg-primary/5 px-4 py-3">
                                <span className="font-bold">إجمالي الفاتورة</span>
                                <span className="text-xl font-bold text-primary">{grandTotal.toFixed(2)}</span>
                            </div>
                            <p className="text-center text-xs text-muted-foreground">
                                {motor.maintenance_orders.length} أوامر صيانة · {motor.maintenance_orders.flatMap((o) => o.parts).length} قطعة
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* ── Payments / Account ── */}
                {isAccountCustomer ? (
                    <Card className="border-blue-200 dark:border-blue-900">
                        <CardContent className="flex items-start gap-4 py-5">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">
                                <Wallet className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-blue-800 dark:text-blue-300">الدفع عبر الحساب الجاري</p>
                                <p className="mt-0.5 text-sm text-blue-700/80 dark:text-blue-400/80">
                                    هذا العميل يملك حساباً جارياً — تُسجَّل الدفعات عبر صفحة العميل وتُحتسب على مجموع فواتيره.
                                </p>
                                <div className="mt-3 flex items-center gap-3">
                                    <div className="rounded-lg bg-blue-50 px-4 py-2 dark:bg-blue-950/30">
                                        <p className="text-xs text-blue-600 dark:text-blue-400">إجمالي هذه الفاتورة</p>
                                        <p className="font-mono font-bold text-blue-800 dark:text-blue-200" dir="ltr">
                                            $ {grandTotal.toFixed(2)}
                                        </p>
                                    </div>
                                    <a href={`/customers/${motor.customer.id}`}>
                                        <Button variant="outline" size="sm" className="gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-50">
                                            <Wallet className="h-3.5 w-3.5" />
                                            صفحة الحساب الجاري
                                        </Button>
                                    </a>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <PaymentsSection motor={motor} grandTotal={grandTotal} isLocked={isLocked} />
                )}

                {/* ── Maintenance orders ── */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Wrench className="h-5 w-5 text-muted-foreground" />
                            <h2 className="text-xl font-bold">
                                أوامر الصيانة
                                <span className="ms-2 text-sm font-normal text-muted-foreground">({motor.maintenance_orders.length})</span>
                            </h2>
                        </div>
                        {!isLocked && (
                            <Button className="gap-2" onClick={() => setShowAddMaintenance(!showAddMaintenance)}>
                                <Plus className="h-4 w-4" />
                                إضافة أمر صيانة
                            </Button>
                        )}
                    </div>

                    {showAddMaintenance && (
                        <Card className="border-primary/30">
                            <CardContent className="pt-6">
                                <MaintenanceOrderForm motorId={motor.id} onCancel={() => setShowAddMaintenance(false)} />
                            </CardContent>
                        </Card>
                    )}

                    {motor.maintenance_orders.length === 0 && !showAddMaintenance ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-14 text-muted-foreground">
                                <Wrench className="mb-3 h-10 w-10 opacity-30" />
                                <p className="text-lg">لا توجد أوامر صيانة مضافة</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {motor.maintenance_orders.map((order) => {
                                const mCfg = maintenanceStatusConfig[order.status] ?? maintenanceStatusConfig.in_progress;
                                const orderTotal = Number(order.labor_cost) + order.parts.reduce((s, p) => s + Number(p.total_cost), 0);
                                return (
                                    <Card key={order.id} className={cn('border-r-4', mCfg.border)}>
                                        <CardContent className="space-y-4 pt-5">
                                            {/* Order header */}
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
                                                        مرحلة {order.stage}
                                                    </span>
                                                    <Badge variant="outline" className={cn('text-sm', mCfg.badge)}>
                                                        {order.status_label}
                                                    </Badge>
                                                    {order.stop_reason && <span className="text-xs text-orange-600">⚠ {order.stop_reason}</span>}
                                                </div>
                                                {!isLocked && (
                                                    <div className="flex items-center gap-1">
                                                        {can('delete-maintenance') && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                                                onClick={() => deleteMaintenance(order.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Description */}
                                            <p className="text-sm leading-relaxed">{order.description}</p>

                                            {/* Meta row */}
                                            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    بدأ: {order.started_at}
                                                </span>
                                                {order.completed_at && (
                                                    <span className="flex items-center gap-1">
                                                        <CalendarCheck className="h-3.5 w-3.5" />
                                                        اكتمل: {order.completed_at}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1 font-bold text-primary">
                                                    <DollarSign className="h-3.5 w-3.5" />
                                                    إجمالي الأمر: {orderTotal.toFixed(2)}
                                                </span>
                                            </div>

                                            {/* Status update */}
                                            {!isLocked && (
                                                <div className="rounded-lg bg-muted/40 px-3 py-2.5">
                                                    <p className="mb-2 text-xs text-muted-foreground">تحديث الحالة</p>
                                                    <MaintenanceStatusBar order={order} />
                                                </div>
                                            )}

                                            {/* Parts */}
                                            <Separator />
                                            <PartsSection order={order} suppliers={suppliers} onDeletePart={deletePart} isLocked={isLocked} />
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            </Main>

            {/* Delete maintenance confirmation */}
            <AlertDialog
                open={!!deleteMaintenanceTarget}
                onOpenChange={(open) => {
                    if (!open) setDeleteMaintenanceTarget(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                        <AlertDialogDescription>
                            سيتم حذف أمر الصيانة <span className="font-bold text-foreground">مرحلة {deleteMaintenanceTarget?.stage}</span>
                            {deleteMaintenanceTarget?.description && (
                                <>
                                    {' '}
                                    — <span className="font-medium text-foreground">"{deleteMaintenanceTarget.description}"</span>
                                </>
                            )}
                            .
                            <br />
                            سيتم حذف جميع القطع المرتبطة به. هذا الإجراء لا يمكن التراجع عنه.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                            className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
                            onClick={confirmDeleteMaintenance}
                        >
                            نعم، احذف
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete part confirmation */}
            <AlertDialog
                open={!!deletePartTarget}
                onOpenChange={(open) => {
                    if (!open) setDeletePartTarget(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                        <AlertDialogDescription>
                            سيتم حذف القطعة <span className="font-bold text-foreground">"{deletePartTarget?.part_name}"</span>.
                            <br />
                            هذا الإجراء لا يمكن التراجع عنه.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction className="text-destructive-foreground bg-destructive hover:bg-destructive/90" onClick={confirmDeletePart}>
                            نعم، احذف
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
