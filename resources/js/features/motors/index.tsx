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
import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { ThemeSwitch } from '@/components/theme-switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { router, Link } from '@inertiajs/react';
import { ArchiveRestore, Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Motor {
    id: number;
    reference_number: string;
    customer_id: number;
    customer_name: string;
    customer_phone: string;
    status: string;
    status_label: string;
    category_name: string | null;
    received_at: string;
    delivered_at: string | null;
    received_by_name: string | null;
    deleted_at: string | null;
}

interface PaginatedMotors {
    data: Motor[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    motors: PaginatedMotors;
    filters: { search?: string; status?: string; archived?: string; per_page?: string };
    per_page: number;
}

const statusColors: Record<string, string> = {
    in_workshop: 'bg-blue-100 text-blue-800 border-blue-200',
    in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    ready: 'bg-green-100 text-green-800 border-green-200',
    delivered: 'bg-gray-100 text-gray-700 border-gray-200',
};


export function Motors({ motors, filters, per_page }: Props) {
    const [search, setSearch]   = useState(filters.search ?? '');
    const [status, setStatus]   = useState(filters.status ?? '');
    const [perPage, setPerPage] = useState(per_page ?? 15);
    const archived               = filters.archived === '1' || filters.archived === 'true';
    const [selected, setSelected]     = useState<Set<number>>(new Set());
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

    const allIds = motors.data.map((m) => m.id);
    const allChecked = allIds.length > 0 && allIds.every((id) => selected.has(id));
    const someChecked = allIds.some((id) => selected.has(id)) && !allChecked;

    function toggleAll() {
        if (allChecked) {
            setSelected(new Set());
        } else {
            setSelected(new Set(allIds));
        }
    }

    function toggleOne(id: number) {
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }

    function applyFilters(newSearch?: string, newStatus?: string, newPerPage?: number) {
        setSelected(new Set());
        router.get(
            '/motors',
            {
                search:   newSearch   ?? search,
                status:   newStatus   ?? status,
                archived: archived ? '1' : '',
                per_page: newPerPage  ?? perPage,
            },
            { preserveState: true, replace: true },
        );
    }

    function changePerPage(value: number) {
        setPerPage(value);
        applyFilters(undefined, undefined, value);
    }

    function toggleArchived() {
        setSelected(new Set());
        router.get(
            '/motors',
            { search: '', status: '', archived: archived ? '' : '1', per_page: perPage },
            { preserveState: false, replace: true },
        );
    }

    function restoreMotor(id: number) {
        router.patch(`/motors/${id}/restore`, {}, { preserveScroll: true });
    }

    function confirmDelete(id: number) {
        setDeleteTarget(id);
    }

    function doDelete() {
        if (deleteTarget !== null) {
            router.delete(`/motors/${deleteTarget}`);
        }
        setDeleteTarget(null);
    }

    function bulkDelete() {
        router.delete('/motors-bulk', {
            data: { ids: Array.from(selected) },
            onSuccess: () => setSelected(new Set()),
        });
        setConfirmOpen(false);
    }

    return (
        <>
            <Header fixed>
                <div className="flex flex-1 items-center gap-3">
                    <div className="relative max-w-sm flex-1">
                        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            className="ps-9 min-h-[44px] text-base"
                            placeholder="بحث بالاسم أو الجوال أو الرقم المرجعي..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                        />
                    </div>
                    {!archived && (
                        <Select
                            value={status}
                            onValueChange={(v) => {
                                setStatus(v === 'all' ? '' : v);
                                applyFilters(undefined, v === 'all' ? '' : v);
                            }}
                        >
                            <SelectTrigger className="w-44 min-h-[44px] text-base">
                                <SelectValue placeholder="كل الحالات" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">كل الحالات</SelectItem>
                                <SelectItem value="in_workshop">في الورشة</SelectItem>
                                <SelectItem value="in_progress">قيد الإصلاح</SelectItem>
                                <SelectItem value="ready">جاهز للاستلام</SelectItem>
                                <SelectItem value="delivered">تم التسليم</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                    <Button onClick={() => applyFilters()} variant="outline" className="min-h-[44px]">
                        بحث
                    </Button>
                    <Button
                        onClick={toggleArchived}
                        variant={archived ? 'default' : 'outline'}
                        className="min-h-[44px] gap-2"
                    >
                        <ArchiveRestore className="h-4 w-4" />
                        {archived ? 'العودة للقيود' : 'الأرشيف'}
                    </Button>
                </div>
                <div className="ms-auto flex items-center gap-3">
                    <ThemeSwitch />
                    <ProfileDropdown />
                </div>
            </Header>

            <Main className="flex flex-1 flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-bold tracking-tight">
                                {archived ? 'الأرشيف' : 'قيود الاستلام'}
                            </h2>
                            {archived && (
                                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                                    محذوفة
                                </span>
                            )}
                        </div>
                        <p className="text-muted-foreground">إجمالي: {motors.total} قيد</p>
                    </div>
                    {!archived && (
                        <Link href="/motors/create">
                            <Button size="lg" className="min-h-12 gap-2 text-base">
                                <Plus className="h-5 w-5" />
                                تسجيل قيد استلام جديد
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Bulk action bar */}
                {!archived && selected.size > 0 && (
                    <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5">
                        <span className="text-sm font-medium">
                            تم تحديد <span className="font-bold text-destructive">{selected.size}</span> قيد استلام
                        </span>
                        <Button
                            variant="destructive"
                            size="sm"
                            className="gap-2 ms-auto"
                            onClick={() => setConfirmOpen(true)}
                        >
                            <Trash2 className="h-4 w-4" />
                            حذف المحدد
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setSelected(new Set())}>
                            إلغاء التحديد
                        </Button>
                    </div>
                )}

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12 text-center">
                                        <Checkbox
                                            checked={allChecked}
                                            ref={(el) => {
                                                if (el) (el as any).indeterminate = someChecked;
                                            }}
                                            onCheckedChange={toggleAll}
                                        />
                                    </TableHead>
                                    <TableHead className="text-right">الرقم المرجعي</TableHead>
                                    <TableHead className="text-right">العميل</TableHead>
                                    <TableHead className="text-right">الجوال</TableHead>
                                    <TableHead className="text-right">الحالة</TableHead>
                                    <TableHead className="text-right">التصنيف</TableHead>
                                    <TableHead className="text-right">المستلم</TableHead>
                                    <TableHead className="text-right">تاريخ الاستلام</TableHead>
                                    <TableHead className="text-right">تاريخ التسليم</TableHead>
                                    <TableHead className="text-right">الإجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {motors.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={11} className="py-12 text-center text-muted-foreground text-lg">
                                            {archived ? 'لا توجد قيود في الأرشيف' : 'لا توجد قيود استلام مطابقة للبحث'}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    motors.data.map((motor) => (
                                        <TableRow
                                            key={motor.id}
                                            data-selected={selected.has(motor.id)}
                                            className={`data-[selected=true]:bg-muted/50 ${archived ? 'opacity-60' : ''}`}
                                        >
                                            <TableCell className="text-center">
                                                {!archived && (
                                                    <Checkbox
                                                        checked={selected.has(motor.id)}
                                                        onCheckedChange={() => toggleOne(motor.id)}
                                                    />
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {archived ? (
                                                    <span className="font-mono font-semibold text-muted-foreground line-through">
                                                        {motor.reference_number}
                                                    </span>
                                                ) : (
                                                    <Link href={`/motors/${motor.id}`} className="font-mono font-semibold text-primary hover:underline underline-offset-2">
                                                        {motor.reference_number}
                                                    </Link>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                <Link href={`/customers/${motor.customer_id}`} className="hover:text-primary hover:underline underline-offset-2 transition-colors">
                                                    {motor.customer_name}
                                                </Link>
                                            </TableCell>
                                            <TableCell dir="ltr" className="text-right">
                                                {motor.customer_phone}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={`min-w-[100px] justify-center text-sm ${archived ? 'border-muted text-muted-foreground' : (statusColors[motor.status] ?? '')}`}
                                                >
                                                    {motor.status_label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {motor.category_name ?? '—'}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {motor.received_by_name ? (
                                                    <span className="flex items-center gap-1.5">
                                                        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                                                            {motor.received_by_name.trim().split(/\s+/).map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                                                        </span>
                                                        <span className="font-medium">{motor.received_by_name}</span>
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell>{motor.received_at}</TableCell>
                                            <TableCell>
                                                {archived ? (
                                                    <span className="text-xs text-amber-600 dark:text-amber-400">
                                                        أُرشف {motor.deleted_at}
                                                    </span>
                                                ) : motor.delivered_at ? (
                                                    motor.delivered_at
                                                ) : (
                                                    <span className="text-muted-foreground text-sm">لم يتم التسليم بعد</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    {archived ? (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="gap-1.5 text-green-700 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-950/30"
                                                            onClick={() => restoreMotor(motor.id)}
                                                        >
                                                            <ArchiveRestore className="h-3.5 w-3.5" />
                                                            استعادة
                                                        </Button>
                                                    ) : (
                                                        <>
                                                            <Link href={`/motors/${motor.id}`}>
                                                                <Button variant="ghost" size="icon" title="عرض">
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                            <Link href={`/motors/${motor.id}/edit`}>
                                                                <Button variant="ghost" size="icon" title="تعديل">
                                                                    <Pencil className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                title="أرشفة"
                                                                className="text-destructive hover:text-destructive"
                                                                onClick={() => confirmDelete(motor.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Pagination */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <p className="text-sm text-muted-foreground">
                            صفحة <span className="font-semibold text-foreground">{motors.current_page}</span> من{' '}
                            <span className="font-semibold text-foreground">{motors.last_page}</span>
                            {' '}—{' '}إجمالي{' '}
                            <span className="font-semibold text-foreground">{motors.total}</span> قيد
                        </p>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <span className="whitespace-nowrap">عدد الصفوف:</span>
                            <Select value={String(perPage)} onValueChange={(v) => changePerPage(Number(v))}>
                                <SelectTrigger className="h-8 w-16 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="15">15</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {motors.last_page > 1 && (
                        <div className="flex items-center gap-1.5">
                            {motors.links.map((link, i) => {
                                const isPrev = link.label.includes('previous') || link.label.includes('Previous') || link.label === '&laquo; Previous';
                                const isNext = link.label.includes('next') || link.label.includes('Next') || link.label === 'Next &raquo;';
                                const displayLabel = isPrev ? '&raquo; السابق' : isNext ? 'التالي &laquo;' : link.label;
                                return (
                                    <Button
                                        key={i}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        className="min-w-[36px]"
                                        disabled={!link.url}
                                        onClick={() => link.url && router.visit(link.url)}
                                        dangerouslySetInnerHTML={{ __html: displayLabel }}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
            </Main>

            {/* Bulk delete confirmation dialog */}
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                        <AlertDialogDescription>
                            سيتم أرشفة <span className="font-bold text-foreground">{selected.size}</span> قيد استلام.
                            هذا الإجراء لا يمكن التراجع عنه بسهولة. هل أنت متأكد؟
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={bulkDelete}
                        >
                            نعم، احذف المحدد
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Single delete confirmation */}
            <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>تأكيد الأرشفة</AlertDialogTitle>
                        <AlertDialogDescription>
                            هل أنت متأكد من أرشفة هذا القيد؟ لا يمكن التراجع عن هذا الإجراء بسهولة.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={doDelete}
                        >
                            نعم، أرشفة
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
