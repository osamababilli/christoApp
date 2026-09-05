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
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCan } from '@/hooks/use-can';
import { Link, router } from '@inertiajs/react';
import { Eye, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Order {
    id: number;
    motor_id: number;
    reference_number: string;
    customer_id: number;
    customer_name: string;
    customer_phone: string;
    stage: number;
    description: string;
    started_at: string;
    completed_at: string | null;
    labor_cost: number;
    status: string;
    status_label: string;
    stop_reason: string | null;
    is_locked: boolean;
}

interface PaginatedOrders {
    data: Order[];
    total: number;
    last_page: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    orders: PaginatedOrders;
    filters: { search?: string; status?: string };
}

const statusColors: Record<string, string> = {
    in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    on_hold: 'bg-red-100 text-red-800 border-red-200',
};

export function Maintenance({ orders, filters }: Props) {
    const can = useCan();
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);

    function applyFilters(newSearch?: string, newStatus?: string) {
        router.get(
            '/maintenance',
            { search: newSearch ?? search, status: newStatus ?? status },
            {
                preserveState: true,
                replace: true,
            },
        );
    }

    function confirmDelete(order: Order) {
        setDeleteTarget(order);
        setDeleteId(order.id);
    }

    function handleDelete() {
        if (!deleteId) return;
        router.delete(`/maintenance/${deleteId}`);
        setDeleteId(null);
        setDeleteTarget(null);
    }

    return (
        <>
            <Header fixed>
                <div className="flex flex-1 items-center gap-3">
                    <div className="relative max-w-sm flex-1">
                        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            className="min-h-[44px] ps-9 text-base"
                            placeholder="بحث..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                        />
                    </div>
                    <Select
                        value={status}
                        onValueChange={(v) => {
                            setStatus(v === 'all' ? '' : v);
                            applyFilters(undefined, v === 'all' ? '' : v);
                        }}
                    >
                        <SelectTrigger className="min-h-[44px] w-44 text-base">
                            <SelectValue placeholder="كل الحالات" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">كل الحالات</SelectItem>
                            <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                            <SelectItem value="completed">مكتمل</SelectItem>
                            <SelectItem value="on_hold">موقوف</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="ms-auto flex items-center gap-3">
                    <ThemeSwitch />
                    <ProfileDropdown />
                </div>
            </Header>

            <Main className="flex flex-1 flex-col gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">أوامر الصيانة</h2>
                    <p className="text-muted-foreground">إجمالي: {orders.total} أمر</p>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-right">المرجع</TableHead>
                                    <TableHead className="text-right">العميل</TableHead>
                                    <TableHead className="text-right">المرحلة</TableHead>
                                    <TableHead className="text-right">الوصف</TableHead>
                                    <TableHead className="text-right">تكلفة العمالة</TableHead>
                                    <TableHead className="text-right">الحالة</TableHead>
                                    <TableHead className="text-right">تاريخ البدء</TableHead>
                                    <TableHead className="text-right">تاريخ الانتهاء</TableHead>
                                    <TableHead className="text-right">الإجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="py-12 text-center text-lg text-muted-foreground">
                                            لا توجد أوامر صيانة
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    orders.data.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell>
                                                <Link
                                                    href={`/motors/${order.motor_id}`}
                                                    className="font-mono font-semibold text-primary underline-offset-4 hover:underline"
                                                >
                                                    {order.reference_number}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <Link
                                                    href={`/customers/${order.customer_id}`}
                                                    className="font-medium text-primary underline-offset-4 hover:underline"
                                                >
                                                    {order.customer_name}
                                                </Link>
                                                <div className="text-right text-xs text-muted-foreground" dir="ltr">
                                                    {order.customer_phone}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-sm font-semibold text-primary">
                                                    {order.stage}
                                                </span>
                                            </TableCell>
                                            <TableCell className="max-w-[200px] truncate">{order.description}</TableCell>
                                            <TableCell>{Number(order.labor_cost).toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`text-sm ${statusColors[order.status] ?? ''}`}>
                                                    {order.status_label}
                                                </Badge>
                                                {order.stop_reason && <p className="mt-1 text-xs text-orange-600">{order.stop_reason}</p>}
                                            </TableCell>
                                            <TableCell>{order.started_at}</TableCell>
                                            <TableCell>
                                                {order.completed_at ? (
                                                    <span className="text-sm font-medium text-green-700 dark:text-green-400">
                                                        {order.completed_at}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Link href={`/motors/${order.motor_id}`}>
                                                        <Button variant="ghost" size="icon" title="عرض قيد الاستلام">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    {!order.is_locked &&
                                                        (can('delete-maintenance') ? (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                title="حذف"
                                                                className="text-destructive hover:text-destructive"
                                                                onClick={() => confirmDelete(order)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        ) : null)}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {orders.last_page > 1 && <PaginationLinks links={orders.links} />}
            </Main>

            <AlertDialog
                open={!!deleteId}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteId(null);
                        setDeleteTarget(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                        <AlertDialogDescription>
                            سيتم حذف أمر الصيانة <span className="font-bold text-foreground">مرحلة {deleteTarget?.stage}</span> لقيد الاستلام{' '}
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
