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
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { router, Link, useForm } from '@inertiajs/react';
import { CreditCard, Pencil, Plus, Search, Star, Trash2, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';

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

interface PaginatedCustomers {
    data: Customer[];
    total: number;
    last_page: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    customers: PaginatedCustomers;
    filters: { search?: string };
}

/* ── Create Dialog ── */
function CreateCustomerDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name:         '',
        phone:        '',
        email:        '',
        notes:        '',
        account_type: 'direct' as 'direct' | 'account',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/customers', {
            preserveScroll: true,
            onSuccess: () => { reset(); onClose(); },
        });
    }

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>إضافة عميل جديد</DialogTitle>
                </DialogHeader>
                <CustomerForm
                    data={data}
                    setData={setData}
                    errors={errors}
                    processing={processing}
                    onSubmit={submit}
                    onCancel={onClose}
                    submitLabel="إضافة العميل"
                />
            </DialogContent>
        </Dialog>
    );
}

/* ── Edit Dialog ── */
function EditCustomerDialog({ customer, onClose }: { customer: Customer | null; onClose: () => void }) {
    const { data, setData, put, processing, errors, reset } = useForm({
        name:         '',
        phone:        '',
        email:        '',
        notes:        '',
        account_type: 'direct' as 'direct' | 'account',
    });

    useEffect(() => {
        if (customer) {
            setData({
                name:         customer.name,
                phone:        customer.phone,
                email:        customer.email ?? '',
                notes:        customer.notes ?? '',
                account_type: customer.account_type,
            });
        }
    }, [customer?.id]);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put(`/customers/${customer!.id}`, {
            preserveScroll: true,
            onSuccess: () => { reset(); onClose(); },
        });
    }

    return (
        <Dialog open={!!customer} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>تعديل بيانات العميل</DialogTitle>
                </DialogHeader>
                {customer && (
                    <CustomerForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        onSubmit={submit}
                        onCancel={onClose}
                        submitLabel="حفظ التعديلات"
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}

/* ── Shared form ── */
function CustomerForm({ data, setData, errors, processing, onSubmit, onCancel, submitLabel }: {
    data: any; setData: any; errors: any; processing: boolean;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
    submitLabel: string;
}) {
    return (
        <form onSubmit={onSubmit} className="space-y-4 pt-2">
            <div className="space-y-1">
                <label className="text-sm font-medium">الاسم <span className="text-destructive">*</span></label>
                <Input
                    autoFocus
                    placeholder="اسم العميل"
                    value={data.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData('name', e.target.value)}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-1">
                <label className="text-sm font-medium">الجوال <span className="text-destructive">*</span></label>
                <Input
                    placeholder="05xxxxxxxx"
                    dir="ltr"
                    value={data.phone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData('phone', e.target.value)}
                />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
            </div>

            <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">البريد الإلكتروني</label>
                <Input
                    type="email"
                    placeholder="example@email.com"
                    dir="ltr"
                    value={data.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData('email', e.target.value)}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">نوع الحساب</label>
                <div className="flex gap-2">
                    {([
                        { value: 'direct',  label: 'دفع مباشر',  Icon: CreditCard, active: 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20' },
                        { value: 'account', label: 'حساب جاري',  Icon: Wallet,     active: 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-300' },
                    ] as const).map(({ value, label, Icon, active }) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => setData('account_type', value)}
                            className={cn(
                                'flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-all',
                                data.account_type === value ? active : 'border-border text-muted-foreground hover:border-primary/30',
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            {label}
                        </button>
                    ))}
                </div>
                <p className="text-xs text-muted-foreground">
                    {data.account_type === 'account'
                        ? 'الدفعات تُسجَّل على مستوى حساب العميل وتُضاف للصندوق تلقائياً'
                        : 'كل فاتورة تُسدَّد بشكل مستقل'}
                </p>
            </div>

            <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">ملاحظات</label>
                <textarea
                    rows={2}
                    className="flex w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                    placeholder="اختياري..."
                    value={data.notes}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('notes', e.target.value)}
                />
            </div>

            <div className="flex gap-2 pt-1">
                <Button type="submit" className="flex-1" disabled={processing}>
                    {processing ? 'جاري الحفظ...' : submitLabel}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel} className="px-6">إلغاء</Button>
            </div>
        </form>
    );
}

/* ── Main component ── */
export function Customers({ customers, filters }: Props) {
    const [search, setSearch]         = useState(filters.search ?? '');
    const [showCreate, setShowCreate] = useState(false);
    const [editTarget, setEditTarget] = useState<Customer | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

    function applyFilters() {
        router.get('/customers', { search }, { preserveState: true, replace: true });
    }

    function confirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/customers/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteTarget(null),
        });
    }

    return (
        <>
            <Header fixed>
                <div className="flex flex-1 items-center gap-3">
                    <div className="relative max-w-sm flex-1">
                        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            className="ps-9 min-h-[44px] text-base"
                            placeholder="بحث بالاسم أو الجوال..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                        />
                    </div>
                    <Button onClick={applyFilters} variant="outline" className="min-h-[44px]">بحث</Button>
                </div>
                <div className="ms-auto flex items-center gap-3">
                    <Button onClick={() => setShowCreate(true)} className="gap-2 min-h-[44px]">
                        <Plus className="h-4 w-4" />
                        عميل جديد
                    </Button>
                    <ThemeSwitch />
                    <ProfileDropdown />
                </div>
            </Header>

            <CreateCustomerDialog open={showCreate} onClose={() => setShowCreate(false)} />
            <EditCustomerDialog customer={editTarget} onClose={() => setEditTarget(null)} />

            {/* Delete confirmation */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>حذف العميل</AlertDialogTitle>
                        <AlertDialogDescription>
                            هل أنت متأكد من حذف العميل <strong>{deleteTarget?.name}</strong>؟
                            لا يمكن التراجع عن هذا الإجراء.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            حذف
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Main className="flex flex-1 flex-col gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">العملاء</h2>
                    <p className="text-muted-foreground">إجمالي: <span dir="ltr">{customers.total}</span> عميل</p>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/40">
                                    <TableHead className="text-right">الاسم</TableHead>
                                    <TableHead className="text-right">الجوال</TableHead>
                                    <TableHead className="text-right hidden md:table-cell">البريد الإلكتروني</TableHead>
                                    <TableHead className="text-center w-28">قيود الاستلام</TableHead>
                                    <TableHead className="text-right hidden lg:table-cell w-32">تاريخ التسجيل</TableHead>
                                    <TableHead className="text-center w-40">الإجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {customers.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-12 text-center text-muted-foreground text-lg">
                                            لا يوجد عملاء
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    customers.data.map((c) => (
                                        <TableRow key={c.id} className="group">
                                            {/* Name + badges */}
                                            <TableCell className="py-3">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <Link
                                                        href={`/customers/${c.id}`}
                                                        className="font-semibold hover:underline underline-offset-4 text-primary"
                                                    >
                                                        {c.name}
                                                    </Link>
                                                    {c.is_loyal && (
                                                        <Badge className="gap-1 bg-amber-100 text-amber-800 border-amber-300 text-xs px-1.5 py-0">
                                                            <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                                                            دائم
                                                        </Badge>
                                                    )}
                                                    {c.account_type === 'account' && (
                                                        <Badge className="gap-1 bg-blue-100 text-blue-800 border-blue-300 text-xs px-1.5 py-0">
                                                            <Wallet className="h-2.5 w-2.5" />
                                                            جاري
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>

                                            {/* Phone */}
                                            <TableCell dir="ltr" className="text-right text-sm tabular-nums py-3">
                                                {c.phone}
                                            </TableCell>

                                            {/* Email */}
                                            <TableCell className="hidden md:table-cell text-sm text-muted-foreground py-3">
                                                {c.email ?? '—'}
                                            </TableCell>

                                            {/* Motors count */}
                                            <TableCell className="text-center py-3">
                                                <span className={cn(
                                                    'inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-sm font-bold',
                                                    c.motors_count > 0
                                                        ? 'bg-primary/10 text-primary'
                                                        : 'bg-muted text-muted-foreground',
                                                )}>
                                                    {c.motors_count}
                                                </span>
                                            </TableCell>

                                            {/* Date */}
                                            <TableCell dir="ltr" className="hidden lg:table-cell text-right text-sm text-muted-foreground tabular-nums py-3">
                                                {c.created_at}
                                            </TableCell>

                                            {/* Actions */}
                                            <TableCell className="py-3">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Link href={`/customers/${c.id}`}>
                                                        <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs gap-1">
                                                            كشف الحساب
                                                        </Button>
                                                    </Link>
                                                    <Link href={`/motors?search=${c.phone}`}>
                                                        <Button variant="ghost" size="sm" className="h-8 px-2.5 text-xs gap-1 text-muted-foreground">
                                                            القيود
                                                        </Button>
                                                    </Link>
                                                    <div className="flex items-center gap-0.5 border-r pr-1.5 mr-0.5">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                            onClick={() => setEditTarget(c)}
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                            onClick={() => setDeleteTarget(c)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {customers.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        {customers.links.map((link, i) => (
                            <Button
                                key={i}
                                variant={link.active ? 'default' : 'outline'}
                                size="sm"
                                disabled={!link.url}
                                onClick={() => link.url && router.visit(link.url)}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </Main>
        </>
    );
}
