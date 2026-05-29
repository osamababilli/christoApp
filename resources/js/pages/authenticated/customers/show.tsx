import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { ThemeSwitch } from '@/components/theme-switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Link, router, useForm } from '@inertiajs/react';
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
import { ArrowRight, CheckCircle2, Clock, CreditCard, FileText, Phone, Plus, Star, Trash2, User, Wallet } from 'lucide-react';
import { useState } from 'react';

interface Motor {
    id: number;
    reference_number: string;
    status: string;
    status_label: string;
    received_at: string | null;
    delivered_at: string | null;
    total_labor: number;
    total_parts: number;
    grand_total: number;
    total_paid: number;
    remaining: number;
}

interface CustomerTransaction {
    id: number;
    type: 'payment' | 'discount';
    type_label: string;
    amount: number;
    notes: string | null;
    transaction_date: string;
}

interface Customer {
    id: number;
    name: string;
    phone: string;
    email: string | null;
    notes: string | null;
    motors_count: number;
    is_loyal: boolean;
    account_type: 'direct' | 'account';
    created_at: string;
}

interface Summary {
    total_motors: number;
    total_invoiced: number;
    total_paid: number;
    total_remaining: number;
}

interface Props {
    customer: Customer;
    motors: Motor[];
    summary: Summary;
    customer_transactions: CustomerTransaction[];
}

const statusColors: Record<string, string> = {
    in_workshop: 'bg-blue-100 text-blue-800 border-blue-200',
    in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    ready:       'bg-green-100 text-green-800 border-green-200',
    delivered:   'bg-gray-100 text-gray-700 border-gray-200',
};

function fmt(n: number) {
    return n.toFixed(2);
}

const paymentTypeConfig = {
    payment:  { label: 'دفعة',  color: 'border-green-300 bg-green-50 text-green-700 dark:bg-green-950/40 dark:border-green-700 dark:text-green-300',     active: 'ring-2 ring-green-400'  },
    discount: { label: 'خصم',   color: 'border-purple-300 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:border-purple-700 dark:text-purple-300', active: 'ring-2 ring-purple-400' },
};

function AccountTransactionsSection({ customerId, transactions, totalInvoiced }: {
    customerId: number;
    transactions: CustomerTransaction[];
    totalInvoiced: number;
}) {
    const [showForm, setShowForm]   = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<CustomerTransaction | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        type:             'payment' as 'payment' | 'discount',
        amount:           '',
        notes:            '',
        transaction_date: new Date().toISOString().split('T')[0],
    });

    const totalPaid     = transactions.filter(t => t.type === 'payment').reduce((s, t) => s + t.amount, 0);
    const totalDiscount = transactions.filter(t => t.type === 'discount').reduce((s, t) => s + t.amount, 0);
    const totalCredited = totalPaid + totalDiscount;
    const remaining     = totalInvoiced - totalCredited;

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(`/customers/${customerId}/transactions`, {
            preserveScroll: true,
            onSuccess: () => { reset(); setShowForm(false); },
        });
    }

    function confirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/transactions/${deleteTarget.id}`, { preserveScroll: true });
        setDeleteTarget(null);
    }

    return (
        <>
            <Card className="border-blue-200 dark:border-blue-900">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Wallet className="h-4 w-4 text-blue-600" />
                            الحساب الجاري
                        </CardTitle>
                        <Button size="sm" className="gap-1.5" onClick={() => setShowForm(!showForm)}>
                            <Plus className="h-3.5 w-3.5" />
                            إضافة دفعة
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Summary */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-xl border bg-muted/40 px-4 py-3">
                            <p className="text-xs text-muted-foreground">إجمالي الفواتير</p>
                            <p className="mt-0.5 text-lg font-bold font-mono" dir="ltr">$ {fmt(totalInvoiced)}</p>
                        </div>
                        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 dark:border-green-900 dark:bg-green-950/30">
                            <p className="text-xs text-green-700 dark:text-green-400">المدفوع</p>
                            <p className="mt-0.5 text-lg font-bold text-green-700 dark:text-green-400 font-mono" dir="ltr">$ {fmt(totalCredited)}</p>
                        </div>
                        <div className={cn(
                            'rounded-xl border px-4 py-3',
                            remaining <= 0
                                ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30'
                                : 'border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/30',
                        )}>
                            <p className={cn('text-xs', remaining <= 0 ? 'text-green-700 dark:text-green-400' : 'text-orange-700 dark:text-orange-400')}>
                                المتبقي
                            </p>
                            <p className={cn('mt-0.5 text-lg font-bold font-mono', remaining <= 0 ? 'text-green-700 dark:text-green-400' : 'text-orange-700 dark:text-orange-400')} dir="ltr">
                                {remaining <= 0 ? '✓ مسدد' : `$ ${fmt(remaining)}`}
                            </p>
                        </div>
                    </div>

                    {/* Add payment form */}
                    {showForm && (
                        <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4 space-y-3">
                            <form onSubmit={submit} className="space-y-3">
                                <div className="flex gap-2">
                                    {(Object.entries(paymentTypeConfig) as [string, typeof paymentTypeConfig.payment][]).map(([val, cfg]) => (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => setData('type', val as 'payment' | 'discount')}
                                            className={cn(
                                                'rounded-lg border px-4 py-1.5 text-sm font-semibold transition-all cursor-pointer',
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
                                            className="flex h-9 w-full rounded-md border bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                                            className="flex h-9 w-full rounded-md border bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            value={data.transaction_date}
                                            onChange={(e) => setData('transaction_date', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground">ملاحظة</label>
                                        <input
                                            type="text"
                                            className="flex h-9 w-full rounded-md border bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            placeholder="اختياري..."
                                            value={data.notes}
                                            onChange={(e) => setData('notes', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button type="submit" size="sm" className="flex-1 gap-2" disabled={processing}>
                                        {processing
                                            ? <><Clock className="h-3.5 w-3.5 animate-spin" /> جاري الحفظ...</>
                                            : <><CheckCircle2 className="h-3.5 w-3.5" /> تسجيل</>}
                                    </Button>
                                    <Button type="button" variant="outline" size="sm" className="px-5" onClick={() => setShowForm(false)}>
                                        إلغاء
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Transactions list */}
                    {transactions.length > 0 && (
                        <div className="overflow-x-auto rounded-lg border">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/40">
                                        <TableHead className="text-right text-xs">النوع</TableHead>
                                        <TableHead className="text-right text-xs">المبلغ</TableHead>
                                        <TableHead className="text-right text-xs">التاريخ</TableHead>
                                        <TableHead className="text-right text-xs">ملاحظة</TableHead>
                                        <TableHead className="w-8" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.map((t) => (
                                        <TableRow key={t.id}>
                                            <TableCell>
                                                <Badge variant="outline" className={cn('text-xs', t.type === 'payment'
                                                    ? 'border-green-300 bg-green-50 text-green-700'
                                                    : 'border-purple-300 bg-purple-50 text-purple-700')}>
                                                    {t.type_label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-mono font-semibold text-sm" dir="ltr">
                                                $ {fmt(t.amount)}
                                            </TableCell>
                                            <TableCell dir="ltr" className="text-right text-sm text-muted-foreground">
                                                {t.transaction_date}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{t.notes ?? '—'}</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                                    onClick={() => setDeleteTarget(t)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {transactions.length === 0 && (
                        <p className="py-4 text-center text-sm text-muted-foreground">لا توجد دفعات مسجلة</p>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>حذف الدفعة</AlertDialogTitle>
                        <AlertDialogDescription>
                            هل أنت متأكد من حذف هذه الدفعة؟ لا يمكن التراجع.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            حذف
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

function AccountTypeToggle({ customer }: { customer: Customer }) {
    const [loading, setLoading] = useState(false);

    function switchTo(type: 'direct' | 'account') {
        setLoading(true);
        router.patch(`/customers/${customer.id}/type`, { account_type: type }, {
            preserveScroll: true,
            onFinish: () => setLoading(false),
        });
    }

    return (
        <div className="flex items-center gap-2 rounded-xl border bg-muted/30 p-1">
            <button
                type="button"
                disabled={loading || customer.account_type === 'direct'}
                onClick={() => switchTo('direct')}
                className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                    customer.account_type === 'direct'
                        ? 'bg-background shadow text-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                )}
            >
                <CreditCard className="h-3.5 w-3.5" />
                دفع مباشر
            </button>
            <button
                type="button"
                disabled={loading || customer.account_type === 'account'}
                onClick={() => switchTo('account')}
                className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                    customer.account_type === 'account'
                        ? 'bg-blue-600 shadow text-white'
                        : 'text-muted-foreground hover:text-foreground',
                )}
            >
                <Wallet className="h-3.5 w-3.5" />
                حساب جاري
            </button>
        </div>
    );
}

export default function CustomerShow({ customer, motors, summary, customer_transactions }: Props) {
    const isAccount = customer.account_type === 'account';

    return (
        <>
            <Header fixed>
                <div className="flex flex-1 items-center gap-3">
                    <Link href="/customers">
                        <Button variant="ghost" size="sm" className="gap-1">
                            <ArrowRight className="h-4 w-4" />
                            العملاء
                        </Button>
                    </Link>
                    <span className="text-muted-foreground">/</span>
                    <span className="font-semibold">{customer.name}</span>
                    {customer.is_loyal && (
                        <Badge className="gap-1 bg-amber-100 text-amber-800 border-amber-300">
                            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                            عميل دائم
                        </Badge>
                    )}
                    {isAccount && (
                        <Badge className="gap-1 bg-blue-100 text-blue-800 border-blue-300">
                            <Wallet className="h-3 w-3" />
                            حساب جاري
                        </Badge>
                    )}
                </div>
                <div className="ms-auto flex items-center gap-3">
                    <AccountTypeToggle customer={customer} />
                    <a href={`/customers/${customer.id}/statement`} target="_blank" rel="noreferrer">
                        <Button variant="outline" size="sm" className="gap-2">
                            <FileText className="h-4 w-4" />
                            كشف حساب PDF
                        </Button>
                    </a>
                    <ThemeSwitch />
                    <ProfileDropdown />
                </div>
            </Header>

            <Main className="flex flex-1 flex-col gap-6">
                {/* Customer info */}
                <div className="flex flex-wrap items-start gap-4">
                    <div className="flex items-center gap-3 rounded-xl border bg-card px-5 py-4 shadow-sm">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <User className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="text-xl font-bold">{customer.name}</p>
                                {customer.is_loyal && (
                                    <Badge className="gap-1 bg-amber-100 text-amber-800 border-amber-300 text-xs">
                                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                        دائم
                                    </Badge>
                                )}
                                {isAccount && (
                                    <Badge className="gap-1 bg-blue-100 text-blue-800 border-blue-300 text-xs">
                                        <Wallet className="h-3 w-3" />
                                        حساب جاري
                                    </Badge>
                                )}
                            </div>
                            <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground" dir="ltr">
                                <Phone className="h-3.5 w-3.5" />
                                {customer.phone}
                            </p>
                            {customer.email && (
                                <p className="text-sm text-muted-foreground">{customer.email}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Summary cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-muted-foreground">عدد قيود الاستلام</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-right">{summary.total_motors}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-muted-foreground">إجمالي الفواتير</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-right font-mono" dir="ltr">$ {fmt(summary.total_invoiced)}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-green-700 dark:text-green-400">
                                {isAccount ? 'المدفوع (حساب جاري)' : 'إجمالي المدفوع'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-right text-green-700 dark:text-green-400 font-mono" dir="ltr">
                                $ {fmt(summary.total_paid)}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className={summary.total_remaining > 0.009
                        ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30'
                        : 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30'}>
                        <CardHeader className="pb-2">
                            <CardTitle className={`text-sm ${summary.total_remaining > 0.009 ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'}`}>
                                المتبقي
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className={`text-2xl font-bold text-right font-mono ${summary.total_remaining > 0.009 ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'}`}
                                dir="ltr">
                                {summary.total_remaining > 0.009 ? `$ ${fmt(summary.total_remaining)}` : '✓ مسدد'}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Account transactions section - only for account type */}
                {isAccount && (
                    <AccountTransactionsSection
                        customerId={customer.id}
                        transactions={customer_transactions}
                        totalInvoiced={summary.total_invoiced}
                    />
                )}

                {/* Motors table */}
                <Card>
                    <CardHeader>
                        <CardTitle>سجل قيود الاستلام</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {motors.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground">
                                لا توجد قيود استلام لهذا العميل
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-right">الرقم المرجعي</TableHead>
                                        <TableHead className="text-right">الحالة</TableHead>
                                        <TableHead className="text-right">تاريخ الاستلام</TableHead>
                                        <TableHead className="text-right">إجمالي الفاتورة</TableHead>
                                        {!isAccount && <TableHead className="text-right">المدفوع</TableHead>}
                                        {!isAccount && <TableHead className="text-right">المتبقي</TableHead>}
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {motors.map((motor) => (
                                        <TableRow key={motor.id}>
                                            <TableCell>
                                                <Link
                                                    href={`/motors/${motor.id}`}
                                                    className="font-mono font-semibold text-primary hover:underline underline-offset-4"
                                                >
                                                    {motor.reference_number}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={`min-w-[90px] justify-center ${statusColors[motor.status] ?? ''}`}
                                                >
                                                    {motor.status_label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell dir="ltr" className="text-right">{motor.received_at ?? '—'}</TableCell>
                                            <TableCell dir="ltr" className="text-right font-mono font-semibold">
                                                $ {fmt(motor.grand_total)}
                                            </TableCell>
                                            {!isAccount && (
                                                <TableCell dir="ltr" className="text-right text-green-700 dark:text-green-400 font-mono font-semibold">
                                                    $ {fmt(motor.total_paid)}
                                                </TableCell>
                                            )}
                                            {!isAccount && (
                                                <TableCell dir="ltr" className="text-right">
                                                    {motor.remaining > 0.009 ? (
                                                        <span className="font-bold text-red-600 dark:text-red-400 font-mono">$ {fmt(motor.remaining)}</span>
                                                    ) : (
                                                        <span className="font-semibold text-green-600 dark:text-green-400">✓ مسدد</span>
                                                    )}
                                                </TableCell>
                                            )}
                                            <TableCell>
                                                <Link href={`/motors/${motor.id}`}>
                                                    <Button variant="ghost" size="sm">عرض</Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {customer.notes && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">ملاحظات</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">{customer.notes}</p>
                        </CardContent>
                    </Card>
                )}
            </Main>
        </>
    );
}
