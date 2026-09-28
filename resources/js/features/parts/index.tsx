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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCan } from '@/hooks/use-can';
import { cn } from '@/lib/utils';
import { Link, router, useForm } from '@inertiajs/react';
import { CheckCircle2, Clock, Package, Plus, Search, Store, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Part {
    id: number;
    part_name: string;
    type: string;
    type_label: string;
    purchased_by: 'customer' | 'company';
    quantity: number;
    unit_cost: number;
    total_cost: number;
    is_paid: boolean;
    is_locked: boolean;
    supplier_name: string | null;
    motor_id: number;
    reference_number: string;
    customer_id: number;
    customer_name: string;
    stage: number;
}

interface PaginatedParts {
    data: Part[];
    total: number;
    last_page: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface ShopPurchase {
    id: number;
    part_name: string;
    part_type: string;
    type_label: string;
    quantity: number;
    unit_cost: number;
    total_cost: number;
    supplier_name: string | null;
    purchase_date: string;
    notes: string | null;
}

interface SupplierOption {
    id: number;
    name: string;
}

interface Props {
    parts: PaginatedParts;
    shop_purchases: ShopPurchase[];
    suppliers: SupplierOption[];
    filters: { search?: string; type?: string };
}

const typeConfig: Record<string, { color: string; active: string; badge: string }> = {
    part: {
        color: 'border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300',
        active: 'ring-2 ring-blue-400',
        badge: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
    },
    oil: {
        color: 'border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300',
        active: 'ring-2 ring-amber-400',
        badge: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    },
    transport: {
        color: 'border-purple-200 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-300',
        active: 'ring-2 ring-purple-400',
        badge: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
    },
    cleaning: {
        color: 'border-cyan-200 bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:border-cyan-800 dark:text-cyan-300',
        active: 'ring-2 ring-cyan-400',
        badge: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800',
    },
    other: {
        color: 'border-gray-200 bg-gray-50 text-gray-600 dark:bg-gray-800/40 dark:border-gray-700 dark:text-gray-300',
        active: 'ring-2 ring-gray-400',
        badge: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/60 dark:text-gray-300 dark:border-gray-700',
    },
};

function ShopPurchasesSection({ purchases, suppliers }: { purchases: ShopPurchase[]; suppliers: SupplierOption[] }) {
    const can = useCan();
    const [showForm, setShowForm] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<ShopPurchase | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        part_name: '',
        supplier_id: '' as number | '',
        quantity: '1',
        unit_cost: '',
        purchase_date: new Date().toISOString().split('T')[0],
        notes: '',
    });

    const totalValue = purchases.reduce((s, p) => s + Number(p.total_cost), 0);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/shop-purchases', {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setShowForm(false);
            },
        });
    }

    function confirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/supplier-purchases/${deleteTarget.id}`, { preserveScroll: true });
        setDeleteTarget(null);
    }

    return (
        <>
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Store className="h-4 w-4 text-muted-foreground" />
                            مشتريات المحل (غير مرتبطة بقيد استلام)
                        </CardTitle>
                        <Button size="sm" className="gap-1.5" onClick={() => setShowForm(!showForm)}>
                            <Plus className="h-3.5 w-3.5" />
                            إضافة مشترى
                        </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">أغراض ومستلزمات تُشترى للمحل نفسه — ليست مرتبطة بأي عميل أو قيد استلام.</p>
                </CardHeader>
                <CardContent className="space-y-4">
                    {showForm && (
                        <div className="space-y-3 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4">
                            <form onSubmit={submit} className="space-y-3">
                                <div className="space-y-1">
                                    <Label className="text-xs">
                                        اسم القطعة / المستلزم <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        value={data.part_name}
                                        onChange={(e) => setData('part_name', e.target.value)}
                                        placeholder="مثال: مفك، شحم، أدوات تنظيف..."
                                        className="min-h-[38px]"
                                    />
                                    {errors.part_name && <p className="text-xs text-destructive">{errors.part_name}</p>}
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                    <div className="space-y-1">
                                        <Label className="text-xs">الكمية</Label>
                                        <Input
                                            type="number"
                                            min="0.001"
                                            step="0.001"
                                            value={data.quantity}
                                            onChange={(e) => setData('quantity', e.target.value)}
                                            className="min-h-[38px]"
                                            dir="ltr"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">سعر الوحدة</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={data.unit_cost}
                                            onChange={(e) => setData('unit_cost', e.target.value)}
                                            className="min-h-[38px]"
                                            dir="ltr"
                                            placeholder="0.00"
                                        />
                                        {errors.unit_cost && <p className="text-xs text-destructive">{errors.unit_cost}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">التاريخ</Label>
                                        <Input
                                            type="date"
                                            value={data.purchase_date}
                                            onChange={(e) => setData('purchase_date', e.target.value)}
                                            className="min-h-[38px]"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">المورد (اختياري)</Label>
                                        <Select
                                            value={data.supplier_id === '' ? '__none__' : String(data.supplier_id)}
                                            onValueChange={(v) => setData('supplier_id', v === '__none__' ? '' : Number(v))}
                                        >
                                            <SelectTrigger className="min-h-[38px]">
                                                <SelectValue placeholder="— بدون مورد —" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="__none__">— بدون مورد —</SelectItem>
                                                {suppliers.map((s) => (
                                                    <SelectItem key={s.id} value={String(s.id)}>
                                                        {s.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">ملاحظات</Label>
                                    <Input
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        placeholder="اختياري..."
                                        className="min-h-[38px]"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button type="submit" size="sm" className="flex-1 gap-2" disabled={processing}>
                                        {processing ? 'جاري الحفظ...' : 'تسجيل المشترى'}
                                    </Button>
                                    <Button type="button" variant="outline" size="sm" className="px-5" onClick={() => setShowForm(false)}>
                                        إلغاء
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}

                    {purchases.length > 0 ? (
                        <div className="overflow-x-auto rounded-lg border">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/40">
                                        <TableHead className="text-right text-xs">التاريخ</TableHead>
                                        <TableHead className="text-right text-xs">القطعة/المستلزم</TableHead>
                                        <TableHead className="text-right text-xs">الكمية</TableHead>
                                        <TableHead className="text-right text-xs">سعر الوحدة</TableHead>
                                        <TableHead className="text-right text-xs">الإجمالي</TableHead>
                                        <TableHead className="text-right text-xs">المورد</TableHead>
                                        <TableHead className="w-8" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {purchases.map((p) => (
                                        <TableRow key={p.id}>
                                            <TableCell dir="ltr" className="text-right text-sm text-muted-foreground">
                                                {p.purchase_date}
                                            </TableCell>
                                            <TableCell className="text-sm font-medium">{p.part_name}</TableCell>
                                            <TableCell className="text-sm">{p.quantity}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{p.unit_cost.toFixed(2)}</TableCell>
                                            <TableCell className="text-sm font-semibold">{p.total_cost.toFixed(2)}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{p.supplier_name ?? '—'}</TableCell>
                                            <TableCell>
                                                {can('delete-suppliers') && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-destructive hover:text-destructive"
                                                        onClick={() => setDeleteTarget(p)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <p className="py-4 text-center text-sm text-muted-foreground">لا توجد مشتريات مسجلة للمحل</p>
                    )}

                    {purchases.length > 0 && (
                        <div className="flex justify-end text-sm font-semibold text-muted-foreground">
                            إجمالي مشتريات المحل: <span className="ms-2 font-bold text-foreground">{totalValue.toFixed(2)}</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>حذف المشترى</AlertDialogTitle>
                        <AlertDialogDescription>هل أنت متأكد من حذف "{deleteTarget?.part_name}"؟ لا يمكن التراجع.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="text-destructive-foreground bg-destructive hover:bg-destructive/90">
                            حذف
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

export function Parts({ parts, shop_purchases, suppliers, filters }: Props) {
    const can = useCan();
    const [search, setSearch] = useState(filters.search ?? '');
    const [deleteTarget, setDeleteTarget] = useState<Part | null>(null);

    function applyFilters(newSearch?: string) {
        router.get(
            '/parts',
            { search: newSearch ?? search },
            {
                preserveState: true,
                replace: true,
            },
        );
    }

    function handleDelete() {
        if (!deleteTarget) return;
        router.delete(`/parts/${deleteTarget.id}`);
        setDeleteTarget(null);
    }

    const paidCount = parts.data.filter((p) => p.is_paid).length;
    const unpaidCount = parts.data.filter((p) => !p.is_paid).length;
    const totalValue = parts.data.reduce((s, p) => s + Number(p.total_cost), 0);

    return (
        <>
            <Header fixed>
                <div className="flex flex-1 flex-wrap items-center gap-2 sm:flex-nowrap sm:gap-3">
                    <div className="relative w-full min-w-[140px] flex-1 sm:max-w-sm">
                        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            className="min-h-[44px] ps-9 text-base"
                            placeholder="بحث بالقطعة أو الرقم المرجعي أو العميل..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                        />
                    </div>
                    <Button onClick={() => applyFilters()} variant="outline" className="min-h-[44px]">
                        بحث
                    </Button>
                </div>
                <div className="flex items-center gap-2 sm:ms-auto sm:gap-3">
                    <ThemeSwitch />
                    <ProfileDropdown />
                </div>
            </Header>

            <Main className="flex flex-1 flex-col gap-5">
                {/* Title + stats */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">القطع والمستلزمات</h2>
                        <p className="text-muted-foreground">إجمالي: {parts.total} قطعة</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2 shadow-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium">{paidCount} مدفوع</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2 shadow-sm">
                            <Clock className="h-4 w-4 text-orange-500" />
                            <span className="text-sm font-medium">{unpaidCount} غير مدفوع</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2 shadow-sm">
                            <Package className="h-4 w-4 text-primary" />
                            <span className="text-sm font-bold text-primary">{totalValue.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <ShopPurchasesSection purchases={shop_purchases} suppliers={suppliers} />

                {/* Table */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">قطع مرتبطة بقيود الاستلام</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-right">قيد الاستلام</TableHead>
                                    <TableHead className="text-right">العميل</TableHead>
                                    <TableHead className="text-right">م</TableHead>
                                    <TableHead className="text-right">القطعة</TableHead>
                                    <TableHead className="text-right">النوع</TableHead>
                                    <TableHead className="text-right">الكمية</TableHead>
                                    <TableHead className="text-right">سعر الوحدة</TableHead>
                                    <TableHead className="text-right">الإجمالي</TableHead>
                                    <TableHead className="text-right">الدفع</TableHead>
                                    <TableHead className="text-right">المورد</TableHead>
                                    <TableHead />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {parts.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={11} className="py-16 text-center">
                                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                <Package className="h-10 w-10 opacity-30" />
                                                <p className="text-lg">لا توجد قطع مطابقة</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    parts.data.map((part) => {
                                        const cfg = typeConfig[part.type] ?? typeConfig.other;
                                        return (
                                            <TableRow key={part.id} className="hover:bg-muted/40">
                                                <TableCell>
                                                    <Link
                                                        href={`/motors/${part.motor_id}`}
                                                        className="font-mono text-sm font-semibold text-primary underline-offset-4 hover:underline"
                                                    >
                                                        {part.reference_number}
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="text-sm font-medium">
                                                    <Link
                                                        href={`/customers/${part.customer_id}`}
                                                        className="text-primary underline-offset-4 hover:underline"
                                                    >
                                                        {part.customer_name}
                                                    </Link>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                                                        {part.stage}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="font-medium">{part.part_name}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={cn('text-xs', cfg.badge)}>
                                                        {part.type_label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm">{Number(part.quantity)}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">{Number(part.unit_cost).toFixed(2)}</TableCell>
                                                <TableCell className="font-semibold">{Number(part.total_cost).toFixed(2)}</TableCell>
                                                <TableCell>
                                                    {part.is_paid ? (
                                                        <Badge
                                                            variant="outline"
                                                            className="gap-1 border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300"
                                                        >
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            مدفوع
                                                        </Badge>
                                                    ) : (
                                                        <Badge
                                                            variant="outline"
                                                            className="gap-1 border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-300"
                                                        >
                                                            <Clock className="h-3 w-3" />
                                                            معلق
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">{part.supplier_name ?? '—'}</TableCell>
                                                <TableCell>
                                                    {!part.is_locked &&
                                                        (can('delete-parts') ? (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                                                onClick={() => setDeleteTarget(part)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        ) : null)}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Pagination */}
                {parts.last_page > 1 && <PaginationLinks links={parts.links} />}
            </Main>

            {/* Delete confirmation */}
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
                            سيتم حذف القطعة <span className="font-bold text-foreground">"{deleteTarget?.part_name}"</span> من قيد الاستلام{' '}
                            <span className="font-bold text-foreground">{deleteTarget?.reference_number}</span>.
                            <br />
                            هذا الإجراء لا يمكن التراجع عنه.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction className="text-destructive-foreground bg-destructive hover:bg-destructive/90" onClick={handleDelete}>
                            نعم، احذف
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
