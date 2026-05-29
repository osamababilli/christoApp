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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/password-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { router, useForm } from '@inertiajs/react';
import { Loader2, Pencil, Plus, Save, Trash2, Users as UsersIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { type User } from './data/schema';

interface Props {
    users: User[];
}

type FormData = {
    name: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    password: string;
    password_confirmation: string;
};

const roleLabels: Record<string, string> = {
    admin: 'مسؤول',
    manager: 'مدير',
    cashier: 'كاشير',
};

const statusLabels: Record<string, string> = {
    active: 'نشط',
    inactive: 'غير نشط',
    suspended: 'موقوف',
};

const statusColors: Record<string, string> = {
    active: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300',
    inactive: 'bg-gray-100 text-gray-600 border-gray-200',
    suspended: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400',
};

function UserDialog({
    open,
    onClose,
    user,
}: {
    open: boolean;
    onClose: () => void;
    user: User | null;
}) {
    const isEdit = !!user;
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm<FormData>({
        name: '',
        email: '',
        phone: '',
        role: 'cashier',
        status: 'active',
        password: '',
        password_confirmation: '',
    });

    useEffect(() => {
        if (open) {
            if (user) {
                setData({
                    name: user.name,
                    email: user.email,
                    phone: user.phone ?? '',
                    role: user.role,
                    status: user.status,
                    password: '',
                    password_confirmation: '',
                });
            } else {
                reset();
                setData('role', 'cashier');
                setData('status', 'active');
            }
            clearErrors();
        }
    }, [open, user]);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (isEdit) {
            put(`/settings/users/${user!.id}`, { preserveScroll: true, onSuccess: onClose });
        } else {
            post('/settings/users', { preserveScroll: true, onSuccess: onClose });
        }
    }

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="u-name">الاسم <span className="text-destructive">*</span></Label>
                        <Input
                            id="u-name"
                            autoFocus
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="الاسم الكامل"
                        />
                        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="u-email">البريد الإلكتروني <span className="text-destructive">*</span></Label>
                        <Input
                            id="u-email"
                            type="email"
                            dir="ltr"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="email@example.com"
                        />
                        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="u-phone">رقم الجوال</Label>
                        <Input
                            id="u-phone"
                            dir="ltr"
                            value={data.phone}
                            onChange={(e) => setData('phone', e.target.value)}
                            placeholder="05xxxxxxxx"
                        />
                        {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label>الدور <span className="text-destructive">*</span></Label>
                            <Select value={data.role} onValueChange={(v) => setData('role', v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">مسؤول</SelectItem>
                                    <SelectItem value="manager">مدير</SelectItem>
                                    <SelectItem value="cashier">كاشير</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.role && <p className="text-xs text-destructive">{errors.role}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label>الحالة <span className="text-destructive">*</span></Label>
                            <Select value={data.status} onValueChange={(v) => setData('status', v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">نشط</SelectItem>
                                    <SelectItem value="inactive">غير نشط</SelectItem>
                                    <SelectItem value="suspended">موقوف</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.status && <p className="text-xs text-destructive">{errors.status}</p>}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="u-pw">
                            {isEdit ? 'كلمة المرور الجديدة' : 'كلمة المرور'}{' '}
                            {!isEdit && <span className="text-destructive">*</span>}
                        </Label>
                        <PasswordInput
                            id="u-pw"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder={isEdit ? 'اتركها فارغة للإبقاء على الحالية' : '8 أحرف على الأقل'}
                        />
                        {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                    </div>

                    {(data.password || !isEdit) && (
                        <div className="space-y-1.5">
                            <Label htmlFor="u-pw-confirm">تأكيد كلمة المرور</Label>
                            <PasswordInput
                                id="u-pw-confirm"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                placeholder="أعد كتابة كلمة المرور"
                            />
                        </div>
                    )}

                    <div className="flex gap-2 pt-1">
                        <Button type="submit" className="flex-1 gap-2" disabled={processing}>
                            {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {processing ? 'جاري الحفظ...' : isEdit ? 'حفظ التعديلات' : 'إضافة المستخدم'}
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

export function Users({ users }: Props) {
    const [dialogOpen, setDialogOpen]     = useState(false);
    const [editTarget, setEditTarget]     = useState<User | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

    function openCreate() {
        setEditTarget(null);
        setDialogOpen(true);
    }

    function openEdit(u: User) {
        setEditTarget(u);
        setDialogOpen(true);
    }

    function handleDelete() {
        if (!deleteTarget) return;
        router.delete(`/settings/users/${deleteTarget.id}`, { preserveScroll: true });
        setDeleteTarget(null);
    }

    return (
        <>
            <div className="w-full space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">المستخدمون</h2>
                        <p className="text-muted-foreground">إدارة حسابات المستخدمين والصلاحيات</p>
                    </div>
                    <Button className="gap-2" onClick={openCreate}>
                        <Plus className="h-4 w-4" />
                        إضافة مستخدم
                    </Button>
                </div>

                {users.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-16 text-muted-foreground">
                        <UsersIcon className="h-10 w-10 opacity-30" />
                        <p className="text-lg">لا يوجد مستخدمون</p>
                        <Button variant="outline" size="sm" className="gap-2" onClick={openCreate}>
                            <Plus className="h-4 w-4" />
                            إضافة أول مستخدم
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/40 hover:bg-muted/40">
                                    <TableHead className="text-right font-semibold">الاسم</TableHead>
                                    <TableHead className="text-right font-semibold">البريد الإلكتروني</TableHead>
                                    <TableHead className="text-right font-semibold">الجوال</TableHead>
                                    <TableHead className="text-right font-semibold">الدور</TableHead>
                                    <TableHead className="text-right font-semibold">الحالة</TableHead>
                                    <TableHead className="text-right font-semibold">تاريخ الإضافة</TableHead>
                                    <TableHead className="w-24 text-center font-semibold">إجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((u) => (
                                    <TableRow key={u.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="font-medium">{u.name}</TableCell>
                                        <TableCell dir="ltr" className="text-right text-sm text-muted-foreground">
                                            {u.email}
                                        </TableCell>
                                        <TableCell dir="ltr" className="text-right text-sm text-muted-foreground">
                                            {u.phone ?? <span className="text-muted-foreground/40">—</span>}
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm">{roleLabels[u.role] ?? u.role}</span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={statusColors[u.status] ?? ''}>
                                                {statusLabels[u.status] ?? u.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground" dir="ltr">
                                            {u.created_at}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-center gap-0.5">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 hover:bg-muted"
                                                    onClick={() => openEdit(u)}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                    onClick={() => setDeleteTarget(u)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            <UserDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                user={editTarget}
            />

            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                        <AlertDialogDescription>
                            سيتم حذف المستخدم{' '}
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
