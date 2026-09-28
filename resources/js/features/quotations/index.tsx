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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCan } from '@/hooks/use-can';
import { cn } from '@/lib/utils';
import { Link, router } from '@inertiajs/react';
import { Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface QuotationRow {
    id: number;
    reference_number: string;
    customer_name: string;
    customer_phone: string;
    status: string;
    status_label: string;
    valid_days: number;
    created_at: string;
}

interface PaginatedQuotations {
    data: QuotationRow[];
    current_page: number;
    last_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    quotations: PaginatedQuotations;
    filters: { search?: string; status?: string };
}

const statusConfig: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700 border-gray-200',
    sent: 'bg-blue-100 text-blue-800 border-blue-200',
    accepted: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
    converted: 'bg-purple-100 text-purple-800 border-purple-200',
};

const statusFilters = [
    { value: '', label: 'الكل' },
    { value: 'draft', label: 'مسودة' },
    { value: 'sent', label: 'تم الإرسال' },
    { value: 'accepted', label: 'مقبول' },
    { value: 'rejected', label: 'مرفوض' },
    { value: 'converted', label: 'تم التحويل' },
];

export function QuotationsList({ quotations, filters }: Props) {
    const can = useCan();
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

    function applyFilters(newSearch?: string, newStatus?: string) {
        router.get(
            '/quotations',
            {
                search: newSearch ?? search,
                status: newStatus ?? status,
            },
            { preserveState: true, replace: true },
        );
    }

    function doDelete() {
        if (deleteTarget !== null) {
            router.delete(`/quotations/${deleteTarget}`);
        }
        setDeleteTarget(null);
    }

    return (
        <>
            <Header fixed>
                <div className="flex flex-1 flex-wrap items-center gap-3">
                    <div className="relative w-full flex-1 sm:max-w-sm">
                        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            className="min-h-[44px] ps-9 text-base"
                            placeholder="بحث بالاسم أو الجوال أو رقم العرض..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                        />
                    </div>
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
                        <h2 className="text-2xl font-bold tracking-tight">عروض الأسعار</h2>
                        <p className="text-muted-foreground">إجمالي: {quotations.total} عرض</p>
                    </div>
                    <Link href="/quotations/create">
                        <Button size="lg" className="min-h-12 gap-2 text-base">
                            <Plus className="h-5 w-5" />
                            إنشاء عرض سعر
                        </Button>
                    </Link>
                </div>

                {/* Status filter chips */}
                <div className="flex flex-wrap gap-2">
                    {statusFilters.map((sf) => (
                        <button
                            key={sf.value}
                            type="button"
                            onClick={() => {
                                setStatus(sf.value);
                                applyFilters(undefined, sf.value);
                            }}
                            className={cn(
                                'cursor-pointer rounded-full border px-3.5 py-1 text-sm font-medium transition-all',
                                status === sf.value
                                    ? 'border-foreground bg-foreground text-background shadow-sm'
                                    : 'border-border bg-background text-muted-foreground hover:bg-muted',
                            )}
                        >
                            {sf.label}
                        </button>
                    ))}
                </div>

                <Card>
                    <CardContent className="overflow-x-auto p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-right">رقم العرض</TableHead>
                                    <TableHead className="text-right">العميل</TableHead>
                                    <TableHead className="text-right">الجوال</TableHead>
                                    <TableHead className="text-right">الحالة</TableHead>
                                    <TableHead className="text-right">الصلاحية</TableHead>
                                    <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                                    <TableHead className="text-right">الإجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {quotations.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-12 text-center text-lg text-muted-foreground">
                                            لا توجد عروض أسعار مطابقة للبحث
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    quotations.data.map((q) => (
                                        <TableRow key={q.id}>
                                            <TableCell>
                                                <Link
                                                    href={`/quotations/${q.id}`}
                                                    className="font-mono font-semibold text-primary underline-offset-2 hover:underline"
                                                >
                                                    {q.reference_number}
                                                </Link>
                                            </TableCell>
                                            <TableCell className="font-medium">{q.customer_name}</TableCell>
                                            <TableCell dir="ltr" className="text-right">
                                                {q.customer_phone}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={cn('min-w-[90px] justify-center text-sm', statusConfig[q.status] ?? '')}
                                                >
                                                    {q.status_label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{q.valid_days} يوم</TableCell>
                                            <TableCell className="text-sm">{q.created_at}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Link href={`/quotations/${q.id}`}>
                                                        <Button variant="ghost" size="icon" title="عرض">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    {q.status !== 'converted' && q.status !== 'rejected' && (
                                                        <Link href={`/quotations/${q.id}/edit`}>
                                                            <Button variant="ghost" size="icon" title="تعديل">
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                    )}
                                                    {can('delete-quotations') && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            title="حذف"
                                                            className="text-destructive hover:text-destructive"
                                                            onClick={() => setDeleteTarget(q.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
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
                {quotations.last_page > 1 && (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-muted-foreground">
                            صفحة <span className="font-semibold text-foreground">{quotations.current_page}</span> من{' '}
                            <span className="font-semibold text-foreground">{quotations.last_page}</span>
                        </p>
                        <PaginationLinks links={quotations.links} />
                    </div>
                )}
            </Main>

            {/* Delete confirmation */}
            <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                        <AlertDialogDescription>هل أنت متأكد من حذف هذا العرض؟ لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction className="text-destructive-foreground bg-destructive hover:bg-destructive/90" onClick={doDelete}>
                            نعم، احذف
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
