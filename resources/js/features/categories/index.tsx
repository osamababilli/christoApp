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
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { router, useForm } from '@inertiajs/react';
import { Loader2, Pencil, Plus, Tag, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Category {
    id: number;
    name: string;
    icon: string | null;
    color: string | null;
}

interface Props {
    categories: Category[];
}

type FormData = { name: string; color: string; icon: string };

const colorMap: Record<string, string> = {
    blue: 'bg-blue-500',
    indigo: 'bg-indigo-500',
    green: 'bg-green-500',
    teal: 'bg-teal-500',
    cyan: 'bg-cyan-500',
    sky: 'bg-sky-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
    pink: 'bg-pink-500',
    yellow: 'bg-yellow-500',
    gray: 'bg-gray-500',
};

const colorOptions = Object.keys(colorMap);

function CategoryDialog({
    open,
    onClose,
    category,
}: {
    open: boolean;
    onClose: () => void;
    category: Category | null;
}) {
    const isEdit = !!category;
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm<FormData>({
        name: '',
        color: '',
        icon: '',
    });

    useEffect(() => {
        if (open) {
            if (category) {
                setData({
                    name: category.name,
                    color: category.color ?? '',
                    icon: category.icon ?? '',
                });
            } else {
                reset();
            }
            clearErrors();
        }
    }, [open, category]);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (isEdit) {
            put(`/settings/categories/${category!.id}`, {
                preserveScroll: true,
                onSuccess: onClose,
            });
        } else {
            post('/settings/categories', {
                preserveScroll: true,
                onSuccess: onClose,
            });
        }
    }

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="cat-name">
                            اسم التصنيف <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="cat-name"
                            autoFocus
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="اسم التصنيف..."
                        />
                        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label>اللون</Label>
                        <div className="flex flex-wrap gap-2">
                            {colorOptions.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setData('color', data.color === color ? '' : color)}
                                    className={`h-7 w-7 rounded-full transition-all ${colorMap[color]} ${
                                        data.color === color
                                            ? 'ring-2 ring-offset-2 ring-foreground scale-110'
                                            : 'opacity-70 hover:opacity-100'
                                    }`}
                                    title={color}
                                />
                            ))}
                        </div>
                        {errors.color && <p className="text-xs text-destructive">{errors.color}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="cat-icon">أيقونة</Label>
                        <Input
                            id="cat-icon"
                            dir="ltr"
                            value={data.icon}
                            onChange={(e) => setData('icon', e.target.value)}
                            placeholder="e.g. Car, Wrench, Bike"
                        />
                        {errors.icon && <p className="text-xs text-destructive">{errors.icon}</p>}
                    </div>

                    <DialogFooter className="flex-row-reverse gap-2 pt-1 sm:justify-start">
                        <Button type="submit" className="flex-1 gap-2" disabled={processing}>
                            {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            {processing ? 'جاري الحفظ...' : isEdit ? 'حفظ التعديلات' : 'إضافة التصنيف'}
                        </Button>
                        <Button type="button" variant="outline" onClick={onClose} className="px-5">
                            إلغاء
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export function Categories({ categories }: Props) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Category | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
    const [deleting, setDeleting] = useState(false);

    function openCreate() {
        setEditTarget(null);
        setDialogOpen(true);
    }

    function openEdit(c: Category) {
        setEditTarget(c);
        setDialogOpen(true);
    }

    function handleDelete() {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(`/settings/categories/${deleteTarget.id}`, {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setDeleteTarget(null);
            },
        });
    }

    return (
        <>
            <div className="w-full space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">التصنيفات</h2>
                        <p className="text-muted-foreground">أضف وعدّل تصنيفات الأجهزة والمركبات</p>
                    </div>
                    <Button className="gap-2" onClick={openCreate}>
                        <Plus className="h-4 w-4" />
                        إضافة تصنيف
                    </Button>
                </div>

                {categories.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-16 text-muted-foreground">
                        <Tag className="h-10 w-10 opacity-30" />
                        <p className="text-lg">لا توجد تصنيفات بعد</p>
                        <Button variant="outline" size="sm" className="gap-2" onClick={openCreate}>
                            <Plus className="h-4 w-4" />
                            إضافة أول تصنيف
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                        {categories.map((c) => {
                            const bgClass = c.color ? (colorMap[c.color] ?? 'bg-gray-500') : 'bg-gray-500';
                            return (
                                <div
                                    key={c.id}
                                    className="group relative flex flex-col items-center gap-3 rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
                                >
                                    <div
                                        className={`flex h-14 w-14 items-center justify-center rounded-full text-white text-lg font-bold ${bgClass}`}
                                    >
                                        {c.name.charAt(0)}
                                    </div>
                                    <span className="text-center text-sm font-semibold leading-tight">{c.name}</span>
                                    {c.icon && (
                                        <span className="text-xs text-muted-foreground">{c.icon}</span>
                                    )}
                                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => openEdit(c)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                            onClick={() => setDeleteTarget(c)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <CategoryDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                category={editTarget}
            />

            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                        <AlertDialogDescription>
                            سيتم حذف التصنيف{' '}
                            <span className="font-bold text-foreground">"{deleteTarget?.name}"</span>.
                            <br />
                            هذا الإجراء لا يمكن التراجع عنه.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleDelete}
                            disabled={deleting}
                        >
                            {deleting ? <Loader2 className="me-1.5 h-4 w-4 animate-spin" /> : null}
                            نعم، احذف
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
