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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCan } from '@/hooks/use-can';
import { cn } from '@/lib/utils';
import { Link, router, useForm, type InertiaFormProps } from '@inertiajs/react';
import { Building2, CreditCard, Landmark, Pencil, Plus, Search, Shield, Star, Trash2, User, Wallet, X } from 'lucide-react';
import { useEffect, useState } from 'react';

type ClientType = 'individual' | 'military' | 'garage' | 'company';

interface ContactPerson {
    name: string;
    phone: string;
    [key: string]: string;
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
    opening_balance: number;
    opening_balance_notes: string | null;
    client_type: ClientType;
    client_type_label: string;
    address?: string | null;
    responsible_name?: string | null;
    responsible_phone?: string | null;
    accounting_name?: string | null;
    accounting_phone?: string | null;
    accounting_email?: string | null;
    contacts?: ContactPerson[];
    created_at: string;
}

const CLIENT_TYPES: Array<{ value: ClientType; label: string; Icon: typeof User }> = [
    { value: 'individual', label: 'فردي', Icon: User },
    { value: 'military', label: 'مؤسسة عسكرية', Icon: Shield },
    { value: 'garage', label: 'كراج', Icon: Landmark },
    { value: 'company', label: 'شركة', Icon: Building2 },
];

function emptyCustomerFormData() {
    return {
        client_type: 'individual' as ClientType,
        name: '',
        phone: '',
        email: '',
        notes: '',
        account_type: 'direct' as 'direct' | 'account',
        opening_balance: '',
        opening_balance_notes: '',
        address: '',
        responsible_name: '',
        responsible_phone: '',
        accounting_name: '',
        accounting_phone: '',
        accounting_email: '',
        contacts: [{ name: '', phone: '' }] as ContactPerson[],
    };
}

type CustomerFormData = ReturnType<typeof emptyCustomerFormData>;

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
    const { data, setData, post, processing, errors, reset, transform } = useForm(emptyCustomerFormData());

    transform((d: CustomerFormData) => ({
        ...d,
        phone: d.client_type === 'military' ? (d.contacts[0]?.phone ?? '') : d.phone,
        contacts: d.client_type === 'individual' ? [] : d.contacts,
    }));

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/customers', {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    }

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-h-[90vh] w-full overflow-y-auto sm:max-w-[60vw]">
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
    const { data, setData, put, processing, errors, reset, transform } = useForm(emptyCustomerFormData());

    transform((d: CustomerFormData) => ({
        ...d,
        phone: d.client_type === 'military' ? (d.contacts[0]?.phone ?? '') : d.phone,
        contacts: d.client_type === 'individual' ? [] : d.contacts,
    }));

    useEffect(() => {
        if (customer) {
            const contacts = customer.contacts && customer.contacts.length > 0 ? customer.contacts : [{ name: '', phone: '' }];

            setData({
                client_type: customer.client_type ?? 'individual',
                name: customer.name,
                phone: customer.phone,
                email: customer.email ?? '',
                notes: customer.notes ?? '',
                account_type: customer.account_type,
                opening_balance: customer.opening_balance > 0 ? String(customer.opening_balance) : '',
                opening_balance_notes: customer.opening_balance_notes ?? '',
                address: customer.address ?? '',
                responsible_name: customer.responsible_name ?? '',
                responsible_phone: customer.responsible_phone ?? '',
                accounting_name: customer.accounting_name ?? '',
                accounting_phone: customer.accounting_phone ?? '',
                accounting_email: customer.accounting_email ?? '',
                contacts,
            });
        }
    }, [customer?.id]);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put(`/customers/${customer!.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    }

    return (
        <Dialog open={!!customer} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-h-[90vh] w-full overflow-y-auto sm:max-w-[60vw]">
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
function CustomerForm({
    data,
    setData,
    errors,
    processing,
    onSubmit,
    onCancel,
    submitLabel,
}: {
    data: CustomerFormData;
    setData: InertiaFormProps<CustomerFormData>['setData'];
    errors: Partial<Record<string, string>>;
    processing: boolean;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
    submitLabel: string;
}) {
    const clientType: ClientType = data.client_type;
    const isMilitary = clientType === 'military';
    const isOrg = clientType === 'garage' || clientType === 'company';

    function setClientType(type: ClientType) {
        setData('client_type', type);
        if (type === 'military' && data.contacts.length !== 1) {
            setData('contacts', [data.contacts[0] ?? { name: '', phone: '' }]);
        }
        if (isOrgType(type) && data.contacts.length === 0) {
            setData('contacts', [{ name: '', phone: '' }]);
        }
    }

    function isOrgType(type: ClientType) {
        return type === 'garage' || type === 'company';
    }

    function updateContact(index: number, field: keyof ContactPerson, value: string) {
        const next = data.contacts.map((c: ContactPerson, i: number) => (i === index ? { ...c, [field]: value } : c));
        setData('contacts', next);
    }

    function addContact() {
        setData('contacts', [...data.contacts, { name: '', phone: '' }]);
    }

    function removeContact(index: number) {
        setData(
            'contacts',
            data.contacts.filter((_: ContactPerson, i: number) => i !== index),
        );
    }

    const nameLabel = {
        individual: 'الاسم الكامل',
        military: 'اسم / رقم الوحدة أو الفرقة',
        garage: 'اسم الكراج',
        company: 'اسم الشركة',
    }[clientType as ClientType];

    const phoneLabel = {
        individual: 'رقم الهاتف',
        military: '',
        garage: 'رقم هاتف الكراج',
        company: 'رقم هاتف الشركة',
    }[clientType as ClientType];

    return (
        <form onSubmit={onSubmit} className="space-y-4 pt-2">
            {/* Client type selector — full width */}
            <div className="space-y-2">
                <label className="text-sm font-medium">
                    نوع العميل <span className="text-destructive">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {CLIENT_TYPES.map(({ value, label, Icon }) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => setClientType(value)}
                            className={cn(
                                'flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-all',
                                clientType === value
                                    ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20'
                                    : 'border-border text-muted-foreground hover:border-primary/30',
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Two balanced columns on wider screens so the dialog doesn't need to scroll */}
            <div className="grid gap-x-6 gap-y-4 lg:grid-cols-2">
                {/* ── Left column: identity ── */}
                <div className="space-y-4">
                    <div className={cn('grid gap-3', isOrg ? 'sm:grid-cols-2' : 'grid-cols-1')}>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">
                                {nameLabel} <span className="text-destructive">*</span>
                            </label>
                            <Input
                                autoFocus
                                placeholder={nameLabel}
                                value={data.name}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData('name', e.target.value)}
                            />
                            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                        </div>

                        {!isMilitary && (
                            <div className="space-y-1">
                                <label className="text-sm font-medium">
                                    {phoneLabel} <span className="text-destructive">*</span>
                                </label>
                                <Input
                                    placeholder="05xxxxxxxx"
                                    dir="ltr"
                                    value={data.phone}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData('phone', e.target.value)}
                                />
                                {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                            </div>
                        )}
                    </div>

                    {isOrg && (
                        <div className="space-y-1">
                            <label className="text-sm font-medium">
                                العنوان <span className="text-destructive">*</span>
                            </label>
                            <Input
                                placeholder="العنوان"
                                value={data.address}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData('address', e.target.value)}
                            />
                            {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
                        </div>
                    )}

                    <div className="grid gap-2 sm:grid-cols-2">
                        <div className="space-y-1">
                            <label className="text-sm font-medium">الشخص المسؤول {isMilitary && <span className="text-destructive">*</span>}</label>
                            <Input
                                placeholder="اسم المسؤول"
                                value={data.responsible_name}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData('responsible_name', e.target.value)}
                            />
                            {errors.responsible_name && <p className="text-xs text-destructive">{errors.responsible_name}</p>}
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">
                                هاتف الشخص المسؤول <span className="text-destructive">*</span>
                            </label>
                            <Input
                                placeholder="05xxxxxxxx"
                                dir="ltr"
                                value={data.responsible_phone}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData('responsible_phone', e.target.value)}
                            />
                            {errors.responsible_phone && <p className="text-xs text-destructive">{errors.responsible_phone}</p>}
                        </div>
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
                            {(
                                [
                                    {
                                        value: 'direct',
                                        label: 'دفع مباشر',
                                        Icon: CreditCard,
                                        active: 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20',
                                    },
                                    {
                                        value: 'account',
                                        label: 'حساب جاري',
                                        Icon: Wallet,
                                        active: 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-300',
                                    },
                                ] as const
                            ).map(({ value, label, Icon, active }) => (
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
                </div>

                {/* ── Right column: contacts, accounting & balance ── */}
                <div className="space-y-4">
                    {(isMilitary || isOrg) && (
                        <div className="space-y-3 rounded-lg border p-3">
                            <label className="text-sm font-medium">
                                الشخص الذي سلّمنا العمل {isOrg && <span className="text-xs text-muted-foreground">(يمكن أكثر من شخص)</span>}{' '}
                                <span className="text-destructive">*</span>
                            </label>
                            <div className="space-y-2">
                                {data.contacts.map((contact: ContactPerson, i: number) => (
                                    <div key={i} className="grid grid-cols-1 items-start gap-2 sm:grid-cols-[1fr_1fr_auto]">
                                        <Input
                                            placeholder="الاسم الكامل"
                                            value={contact.name}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateContact(i, 'name', e.target.value)}
                                        />
                                        <Input
                                            placeholder="رقم الهاتف"
                                            dir="ltr"
                                            value={contact.phone}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateContact(i, 'phone', e.target.value)}
                                        />
                                        {isOrg && data.contacts.length > 1 ? (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 shrink-0 justify-self-start text-muted-foreground hover:text-destructive sm:justify-self-auto"
                                                onClick={() => removeContact(i)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        ) : (
                                            <div className="hidden sm:block" />
                                        )}
                                    </div>
                                ))}
                            </div>
                            {isOrg && (
                                <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addContact}>
                                    <Plus className="h-3.5 w-3.5" />
                                    إضافة شخص آخر
                                </Button>
                            )}
                            {errors.contacts && <p className="text-xs text-destructive">{errors.contacts}</p>}
                        </div>
                    )}

                    <div className="space-y-3 rounded-lg border p-3">
                        <label className="text-sm font-medium">
                            مسؤول الحسابات <span className="text-destructive">*</span>
                        </label>
                        <div className="grid gap-2 sm:grid-cols-2">
                            <Input
                                placeholder="الاسم الكامل"
                                value={data.accounting_name}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData('accounting_name', e.target.value)}
                            />
                            <Input
                                placeholder="رقم الهاتف"
                                dir="ltr"
                                value={data.accounting_phone}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData('accounting_phone', e.target.value)}
                            />
                            <Input
                                type="email"
                                placeholder="البريد الإلكتروني"
                                dir="ltr"
                                className="sm:col-span-2"
                                value={data.accounting_email}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData('accounting_email', e.target.value)}
                            />
                        </div>
                        <div className="grid gap-1 text-xs text-destructive">
                            {errors.accounting_name && <p>{errors.accounting_name}</p>}
                            {errors.accounting_phone && <p>{errors.accounting_phone}</p>}
                            {errors.accounting_email && <p>{errors.accounting_email}</p>}
                        </div>
                    </div>

                    {/* Opening balance */}
                    <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-900 dark:bg-amber-950/20">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">رصيد مرحّل</span>
                            <span className="text-xs text-amber-600 dark:text-amber-400">(اختياري)</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground">المبلغ المرحّل</label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    dir="ltr"
                                    value={data.opening_balance}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData('opening_balance', e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground">ملاحظة</label>
                                <Input
                                    placeholder="مثال: رصيد 2024"
                                    value={data.opening_balance_notes}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData('opening_balance_notes', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-muted-foreground">ملاحظات</label>
                        <textarea
                            rows={2}
                            className="flex w-full resize-none rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                            placeholder="اختياري..."
                            value={data.notes}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('notes', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="flex gap-2 pt-1">
                <Button type="submit" className="flex-1" disabled={processing}>
                    {processing ? 'جاري الحفظ...' : submitLabel}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel} className="px-6">
                    إلغاء
                </Button>
            </div>
        </form>
    );
}

/* ── Main component ── */
export function Customers({ customers, filters }: Props) {
    const can = useCan();
    const [search, setSearch] = useState(filters.search ?? '');
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
                            className="min-h-[44px] ps-9 text-base"
                            placeholder="بحث بالاسم أو الجوال..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                        />
                    </div>
                    <Button onClick={applyFilters} variant="outline" className="min-h-[44px]">
                        بحث
                    </Button>
                </div>
                <div className="ms-auto flex items-center gap-3">
                    <Button onClick={() => setShowCreate(true)} className="min-h-[44px] gap-2">
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
                            هل أنت متأكد من حذف العميل <strong>{deleteTarget?.name}</strong>؟ لا يمكن التراجع عن هذا الإجراء.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="text-destructive-foreground bg-destructive hover:bg-destructive/90">
                            حذف
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Main className="flex flex-1 flex-col gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">العملاء</h2>
                    <p className="text-muted-foreground">
                        إجمالي: <span dir="ltr">{customers.total}</span> عميل
                    </p>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/40">
                                    <TableHead className="text-right">الاسم</TableHead>
                                    <TableHead className="text-right">الجوال</TableHead>
                                    <TableHead className="hidden text-right md:table-cell">البريد الإلكتروني</TableHead>
                                    <TableHead className="w-28 text-center">قيود الاستلام</TableHead>
                                    <TableHead className="hidden w-32 text-right lg:table-cell">تاريخ التسجيل</TableHead>
                                    <TableHead className="w-40 text-center">الإجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {customers.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-12 text-center text-lg text-muted-foreground">
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
                                                        className="font-semibold text-primary underline-offset-4 hover:underline"
                                                    >
                                                        {c.name}
                                                    </Link>
                                                    {c.client_type !== 'individual' && (
                                                        <Badge variant="outline" className="px-1.5 py-0 text-xs text-muted-foreground">
                                                            {c.client_type_label}
                                                        </Badge>
                                                    )}
                                                    {c.is_loyal && (
                                                        <Badge className="gap-1 border-amber-300 bg-amber-100 px-1.5 py-0 text-xs text-amber-800">
                                                            <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                                                            دائم
                                                        </Badge>
                                                    )}
                                                    {c.account_type === 'account' && (
                                                        <Badge className="gap-1 border-blue-300 bg-blue-100 px-1.5 py-0 text-xs text-blue-800">
                                                            <Wallet className="h-2.5 w-2.5" />
                                                            جاري
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>

                                            {/* Phone */}
                                            <TableCell dir="ltr" className="py-3 text-right text-sm tabular-nums">
                                                {c.phone}
                                            </TableCell>

                                            {/* Email */}
                                            <TableCell className="hidden py-3 text-sm text-muted-foreground md:table-cell">
                                                {c.email ?? '—'}
                                            </TableCell>

                                            {/* Motors count */}
                                            <TableCell className="py-3 text-center">
                                                <span
                                                    className={cn(
                                                        'inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-sm font-bold',
                                                        c.motors_count > 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                                                    )}
                                                >
                                                    {c.motors_count}
                                                </span>
                                            </TableCell>

                                            {/* Date */}
                                            <TableCell
                                                dir="ltr"
                                                className="hidden py-3 text-right text-sm text-muted-foreground tabular-nums lg:table-cell"
                                            >
                                                {c.created_at}
                                            </TableCell>

                                            {/* Actions */}
                                            <TableCell className="py-3">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Link href={`/customers/${c.id}`}>
                                                        <Button variant="outline" size="sm" className="h-8 gap-1 px-2.5 text-xs">
                                                            كشف الحساب
                                                        </Button>
                                                    </Link>
                                                    <Link href={`/motors?search=${c.phone}`}>
                                                        <Button variant="ghost" size="sm" className="h-8 gap-1 px-2.5 text-xs text-muted-foreground">
                                                            القيود
                                                        </Button>
                                                    </Link>
                                                    <div className="mr-0.5 flex items-center gap-0.5 border-r pr-1.5">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                            onClick={() => setEditTarget(c)}
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        {can('delete-customers') && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                                onClick={() => setDeleteTarget(c)}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        )}
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

                {customers.last_page > 1 && <PaginationLinks links={customers.links} />}
            </Main>
        </>
    );
}
