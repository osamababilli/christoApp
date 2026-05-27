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
import { Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Motor {
    id: number;
    reference_number: string;
    customer_name: string;
    customer_phone: string;
    brand: string | null;
    model: string | null;
    status: string;
    status_label: string;
    condition_rating: string | null;
    condition_label: string | null;
    received_at: string;
    delivered_at: string | null;
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
    filters: { search?: string; status?: string };
}

const statusColors: Record<string, string> = {
    in_workshop: 'bg-blue-100 text-blue-800 border-blue-200',
    in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    ready: 'bg-green-100 text-green-800 border-green-200',
    delivered: 'bg-gray-100 text-gray-700 border-gray-200',
};

const conditionColors: Record<string, string> = {
    excellent: 'bg-emerald-100 text-emerald-700',
    good: 'bg-blue-100 text-blue-700',
    fair: 'bg-amber-100 text-amber-700',
    poor: 'bg-red-100 text-red-700',
};

export function Motors({ motors, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [confirmOpen, setConfirmOpen] = useState(false);

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

    function applyFilters(newSearch?: string, newStatus?: string) {
        setSelected(new Set());
        router.get(
            '/motors',
            { search: newSearch ?? search, status: newStatus ?? status },
            { preserveState: true, replace: true },
        );
    }

    function deleteMotor(id: number) {
        if (confirm('هل أنت متأكد من أرشفة هذا الموتور؟')) {
            router.delete(`/motors/${id}`);
        }
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
                    <Button onClick={() => applyFilters()} variant="outline" className="min-h-[44px]">
                        بحث
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
                        <h2 className="text-2xl font-bold tracking-tight">قائمة الموتورات</h2>
                        <p className="text-muted-foreground">إجمالي: {motors.total} موتور</p>
                    </div>
                    <Link href="/motors/create">
                        <Button size="lg" className="min-h-12 gap-2 text-base">
                            <Plus className="h-5 w-5" />
                            تسجيل موتور جديد
                        </Button>
                    </Link>
                </div>

                {/* Bulk action bar */}
                {selected.size > 0 && (
                    <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5">
                        <span className="text-sm font-medium">
                            تم تحديد <span className="font-bold text-destructive">{selected.size}</span> موتور
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
                                    <TableHead className="text-right">الماركة / الموديل</TableHead>
                                    <TableHead className="text-right">الحالة</TableHead>
                                    <TableHead className="text-right">الحالة الفنية</TableHead>
                                    <TableHead className="text-right">تاريخ الاستلام</TableHead>
                                    <TableHead className="text-right">تاريخ التسليم</TableHead>
                                    <TableHead className="text-right">الإجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {motors.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={10} className="py-12 text-center text-muted-foreground text-lg">
                                            لا توجد موتورات مطابقة للبحث
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    motors.data.map((motor) => (
                                        <TableRow
                                            key={motor.id}
                                            data-selected={selected.has(motor.id)}
                                            className="data-[selected=true]:bg-muted/50"
                                        >
                                            <TableCell className="text-center">
                                                <Checkbox
                                                    checked={selected.has(motor.id)}
                                                    onCheckedChange={() => toggleOne(motor.id)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Link
                                                    href={`/motors/${motor.id}`}
                                                    className="font-mono font-semibold text-primary hover:underline underline-offset-4"
                                                >
                                                    {motor.reference_number}
                                                </Link>
                                            </TableCell>
                                            <TableCell className="font-medium">{motor.customer_name}</TableCell>
                                            <TableCell dir="ltr" className="text-right">
                                                {motor.customer_phone}
                                            </TableCell>
                                            <TableCell>
                                                {motor.brand || motor.model
                                                    ? `${motor.brand ?? ''} ${motor.model ?? ''}`.trim()
                                                    : '—'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={`min-w-[100px] justify-center text-sm ${statusColors[motor.status] ?? ''}`}
                                                >
                                                    {motor.status_label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {motor.condition_label ? (
                                                    <Badge
                                                        variant="secondary"
                                                        className={conditionColors[motor.condition_rating ?? ''] ?? ''}
                                                    >
                                                        {motor.condition_label}
                                                    </Badge>
                                                ) : (
                                                    '—'
                                                )}
                                            </TableCell>
                                            <TableCell>{motor.received_at}</TableCell>
                                            <TableCell>
                                                {motor.delivered_at ? (
                                                    motor.delivered_at
                                                ) : (
                                                    <span className="text-muted-foreground text-sm">لم يتم التسليم بعد</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
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
                                                        onClick={() => deleteMotor(motor.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
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
                {motors.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        {motors.links.map((link, i) => (
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

            {/* Bulk delete confirmation dialog */}
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                        <AlertDialogDescription>
                            سيتم أرشفة <span className="font-bold text-foreground">{selected.size}</span> موتور.
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
        </>
    );
}
