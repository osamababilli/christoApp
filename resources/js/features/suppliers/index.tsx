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
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { router, useForm } from '@inertiajs/react';
import { Loader2, Package, Pencil, Plus, Save, Search, Trash2, Truck } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Supplier {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
    notes: string | null;
    parts_count: number;
    created_at: string;
}

interface PaginatedSuppliers {
    data: Supplier[];
    total: number;
    last_page: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    suppliers: PaginatedSuppliers;
    filters: { search?: string };
}

type FormData = { name: string; phone: string; email: string; notes: string };

function SupplierDialog({
    open,
    onClose,
    supplier,
}: {
    open: boolean;
    onClose: () => void;
    supplier: Supplier | null;
}) {
    const isEdit = !!supplier;
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm<FormData>({
        name:  '',
        phone: '',
        email: '',
        notes: '',
    });

    useEffect(() => {
        if (open) {
            if (supplier) {
                setData({
                    name:  supplier.name,
                    phone: supplier.phone ?? '',
                    email: supplier.email ?? '',
                    notes: supplier.notes ?? '',
                });
            } else {
                reset();
            }
            clearErrors();
        }
    }, [open, supplier]);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (isEdit) {
            put(`/suppliers/${supplier!.id}`, {
                preserveScroll: true,
                onSuccess: onClose,
            });
        } else {
            post('/suppliers', {
                preserveScroll: true,
                onSuccess: onClose,
            });
        }
    }

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'تعديل المورد' : 'إضافة مورد جديد'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="sup-name">
                            الاسم <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="sup-name"
                            autoFocus
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="اسم المورد..."
                        />
                        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="sup-phone">الجوال</Label>
                            <Input
                                id="sup-phone"
                                dir="ltr"
                                value={data.phone}
                                onChange={(e) => setData('phone', e.target.value)}
                                placeholder="05xxxxxxxx"
                            />
                            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="sup-email">البريد الإلكتروني</Label>
                            <Input
                                id="sup-email"
                                type="email"
                                dir="ltr"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="email@example.com"
                            />
                            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="sup-notes">ملاحظات</Label>
                        <Textarea
                            id="sup-notes"
                            rows={3}
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            placeholder="ملاحظات اختيارية..."
                        />
                        {errors.notes && <p className="text-xs text-destructive">{errors.notes}</p>}
                    </div>

                    <div className="flex gap-2 pt-1">
                        <Button type="submit" className="flex-1 gap-2" disabled={processing}>
                            {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {processing ? 'جاري الحفظ...' : isEdit ? 'حفظ التعديلات' : 'إضافة المورد'}
                        </Button>
                        <Button type="button" variant="outline" onClick={onClose} className="px-5">
                            إلغاء
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export function Suppliers({ suppliers, filters }: Props) {
    const [search, setSearch]           = useState(filters.search ?? '');
    const [dialogOpen, setDialogOpen]   = useState(false);
    const [editTarget, setEditTarget]   = useState<Supplier | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);

    function applyFilters() {
        router.get('/suppliers', { search }, { preserveState: true, replace: true });
    }

    function openCreate() {
        setEditTarget(null);
        setDialogOpen(true);
    }

    function openEdit(s: Supplier) {
        setEditTarget(s);
        setDialogOpen(true);
    }

    function handleDelete() {
        if (!deleteTarget) return;
        router.delete(`/suppliers/${deleteTarget.id}`, { preserveScroll: true });
        setDeleteTarget(null);
    }

    return (
        <>
            <Header fixed>
                <div className="flex flex-1 items-center gap-3">
                    <div className="relative max-w-sm flex-1">
                        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            className="ps-9 min-h-[44px] text-base"
                            placeholder="بحث بالاسم أو الجوال أو البريد..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                        />
                    </div>
                    <Button onClick={applyFilters} variant="outline" className="min-h-[44px]">بحث</Button>
                </div>
                <div className="ms-auto flex items-center gap-3">
                    <ThemeSwitch />
                    <ProfileDropdown />
                </div>
            </Header>

            <Main className="flex flex-1 flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">الموردون</h2>
                        <p className="text-muted-foreground">إجمالي: {suppliers.total} مورد</p>
                    </div>
                    <Button className="gap-2" onClick={openCreate}>
                        <Plus className="h-4 w-4" />
                        إضافة مورد
                    </Button>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-right">الاسم</TableHead>
                                    <TableHead className="text-right">الجوال</TableHead>
                                    <TableHead className="text-right">البريد الإلكتروني</TableHead>
                                    <TableHead className="text-right">عدد القطع</TableHead>
                                    <TableHead className="text-right">ملاحظات</TableHead>
                                    <TableHead className="text-right">تاريخ الإضافة</TableHead>
                                    <TableHead />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {suppliers.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-16 text-center">
                                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                <Truck className="h-10 w-10 opacity-30" />
                                                <p className="text-lg">لا يوجد موردون</p>
                                                <Button variant="outline" size="sm" className="mt-1 gap-2" onClick={openCreate}>
                                                    <Plus className="h-4 w-4" />
                                                    إضافة أول مورد
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    suppliers.data.map((s) => (
                                        <TableRow key={s.id} className="hover:bg-muted/40">
                                            <TableCell className="font-semibold">{s.name}</TableCell>
                                            <TableCell dir="ltr" className="text-right text-sm">
                                                {s.phone ?? '—'}
                                            </TableCell>
                                            <TableCell className="text-sm">{s.email ?? '—'}</TableCell>
                                            <TableCell>
                                                <span className="flex items-center gap-1.5 text-sm">
                                                    <Package className="h-3.5 w-3.5 text-muted-foreground" />
                                                    {s.parts_count}
                                                </span>
                                            </TableCell>
                                            <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                                                {s.notes ?? '—'}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{s.created_at}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => openEdit(s)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                                        onClick={() => setDeleteTarget(s)}
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

                {suppliers.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        {suppliers.links.map((link, i) => (
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

            <SupplierDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                supplier={editTarget}
            />

            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                        <AlertDialogDescription>
                            سيتم حذف المورد{' '}
                            <span className="font-bold text-foreground">"{deleteTarget?.name}"</span>.
                            <br />
                            هذا الإجراء لا يمكن التراجع عنه.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
