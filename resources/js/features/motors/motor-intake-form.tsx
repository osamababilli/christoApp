import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { EmployeesActionDialog } from '@/features/employees/components/employees-action-dialog';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import {
    Check,
    ChevronDown,
    ChevronsUpDown,
    ChevronUp,
    Loader2,
    Package,
    Plus,
    Save,
    Settings2,
    Trash2,
    User,
    UserCheck,
    Wallet,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { CustomerCombobox, type CustomerOption } from './customer-combobox';
import type { EmployeeOption } from './motor-form';

interface SupplierOption {
    id: number;
    name: string;
}

type PartRow = {
    part_name: string;
    type: string;
    quantity: string;
    purchased_by: 'customer' | 'company';
    unit_cost: string;
    unit_price: string;
    supplier_id: number | '';
    is_paid: boolean;
};

type ReceivedItemRow = {
    item_name: string;
    quantity: string;
};

interface Props {
    customers: CustomerOption[];
    employees: EmployeeOption[];
    suppliers: SupplierOption[];
}

function emptyPartRow(): PartRow {
    return { part_name: '', type: 'part', quantity: '1', purchased_by: 'customer', unit_cost: '', unit_price: '', supplier_id: '', is_paid: false };
}

function emptyReceivedItemRow(): ReceivedItemRow {
    return { item_name: '', quantity: '1' };
}

export function MotorIntakeForm({ customers, employees, suppliers }: Props) {
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [customerId, setCustomerId] = useState<number | null>(null);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [description, setDescription] = useState('');
    const [receivedItems, setReceivedItems] = useState<ReceivedItemRow[]>([emptyReceivedItemRow()]);
    const [parts, setParts] = useState<PartRow[]>([]);

    // ── مورد جديد (يُفتح لصف قطعة محدد) ──
    const [newSupplierForRow, setNewSupplierForRow] = useState<number | null>(null);
    const [newSupName, setNewSupName] = useState('');
    const [newSupPhone, setNewSupPhone] = useState('');
    const [creatingSupplier, setCreatingSupplier] = useState(false);

    // ── دفعة مسبقة (اختياري، نادر الحدوث) ──
    const [hasDeposit, setHasDeposit] = useState(false);
    const [depositAmount, setDepositAmount] = useState('');
    const [depositMethod, setDepositMethod] = useState<'cash' | 'whish' | 'omt'>('cash');
    const [depositAccount, setDepositAccount] = useState('');
    const [depositFullPayment, setDepositFullPayment] = useState(false);

    // ── تفاصيل إضافية (اختياري) ──
    const [showExtra, setShowExtra] = useState(false);
    const [notes, setNotes] = useState('');
    const [receivedBy, setReceivedBy] = useState<number | null>(null);
    const [empOpen, setEmpOpen] = useState(false);
    const [showAddEmployee, setShowAddEmployee] = useState(false);

    function addReceivedItem() {
        setReceivedItems((prev) => [...prev, emptyReceivedItemRow()]);
    }

    function removeReceivedItem(idx: number) {
        setReceivedItems((prev) => prev.filter((_, i) => i !== idx));
    }

    function updateReceivedItem<K extends keyof ReceivedItemRow>(idx: number, field: K, value: ReceivedItemRow[K]) {
        setReceivedItems((prev) => prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row)));
    }

    function addPart() {
        setParts((prev) => [...prev, emptyPartRow()]);
    }

    function removePart(idx: number) {
        setParts((prev) => prev.filter((_, i) => i !== idx));
        if (newSupplierForRow === idx) setNewSupplierForRow(null);
    }

    function updatePart<K extends keyof PartRow>(idx: number, field: K, value: PartRow[K]) {
        setParts((prev) => prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row)));
    }

    function createSupplierForRow() {
        if (!newSupName.trim()) return;
        setCreatingSupplier(true);
        router.post(
            '/suppliers',
            { name: newSupName.trim(), phone: newSupPhone.trim() },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    setNewSupplierForRow(null);
                    setNewSupName('');
                    setNewSupPhone('');
                },
                onFinish: () => setCreatingSupplier(false),
            },
        );
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        const payload = {
            customer_id: customerId,
            customer_name: customerName,
            customer_phone: customerPhone,
            notes,
            received_by: receivedBy,
            description,
            received_items: receivedItems.filter((r) => r.item_name.trim() !== '').map((r) => ({ item_name: r.item_name, quantity: r.quantity })),
            parts: parts
                .filter((p) => p.part_name.trim() !== '')
                .map((p) => ({
                    part_name: p.part_name,
                    type: p.type,
                    quantity: p.quantity,
                    purchased_by: p.purchased_by,
                    unit_cost: p.purchased_by === 'company' ? p.unit_cost : null,
                    unit_price: p.purchased_by === 'company' ? p.unit_price : null,
                    supplier_id: p.purchased_by === 'company' && p.supplier_id !== '' ? p.supplier_id : null,
                    is_paid: p.purchased_by === 'company' ? p.is_paid : true,
                })),
            deposit:
                hasDeposit && depositAmount.trim() !== ''
                    ? {
                          amount: depositAmount,
                          payment_method: depositMethod,
                          account_name: depositAccount.trim() || null,
                          is_full_payment: depositFullPayment,
                      }
                    : null,
        };

        router.post('/motors', payload, {
            onError: (errs: Record<string, string>) => {
                setErrors(errs);
                setProcessing(false);
            },
            onFinish: () => setProcessing(false),
        });
    }

    return (
        <>
            <form onSubmit={submit} className="mx-auto max-w-2xl space-y-5 pb-10">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">تسجيل قيد استلام جديد</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        عبّئ بيانات العميل ووصف العطل، واحفظ — يمكنك إضافة التفاصيل لاحقًا من صفحة القيد.
                    </p>
                </div>

                <Separator />

                {/* 1. العميل */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <User className="h-4 w-4 text-muted-foreground" />
                            بيانات العميل
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CustomerCombobox
                            customers={customers}
                            selectedId={customerId}
                            newName={customerName}
                            newPhone={customerPhone}
                            onSelectExisting={(c) => {
                                setCustomerId(c.id || null);
                                setCustomerName(c.name);
                                setCustomerPhone(c.phone);
                            }}
                            onNewNameChange={setCustomerName}
                            onNewPhoneChange={setCustomerPhone}
                            errors={errors as Record<string, string>}
                        />
                    </CardContent>
                </Card>

                {/* 2. المستلم */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <UserCheck className="h-4 w-4 text-muted-foreground" />
                            المستلم <span className="text-destructive">*</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {receivedBy !== null &&
                            (() => {
                                const emp = employees.find((e) => e.id === receivedBy);
                                if (!emp) return null;
                                const initials = emp.full_name
                                    .trim()
                                    .split(/\s+/)
                                    .map((w) => w[0])
                                    .join('')
                                    .slice(0, 2)
                                    .toUpperCase();
                                return (
                                    <div className="flex items-center justify-between rounded-xl border bg-muted/40 px-3 py-2.5">
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                                                {initials}
                                            </div>
                                            <div>
                                                <p className="text-sm leading-tight font-semibold">{emp.full_name}</p>
                                                <p className="text-xs text-muted-foreground">موظف مستلم</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setReceivedBy(null)}
                                            className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                );
                            })()}

                        <div className="flex gap-2">
                            <Popover open={empOpen} onOpenChange={setEmpOpen}>
                                <PopoverTrigger asChild>
                                    <button
                                        type="button"
                                        className={cn(
                                            'flex flex-1 items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors',
                                            'hover:bg-muted/50 focus:ring-2 focus:ring-ring focus:outline-none',
                                            receivedBy !== null ? 'border-dashed text-muted-foreground' : 'text-muted-foreground',
                                        )}
                                    >
                                        <span>{receivedBy !== null ? 'تغيير المستلم' : 'اختر موظفاً مستلماً...'}</span>
                                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[280px] max-w-[90vw] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="ابحث عن موظف..." />
                                        <CommandList>
                                            <CommandEmpty>لا يوجد موظف بهذا الاسم.</CommandEmpty>
                                            <CommandGroup>
                                                {employees.map((emp) => {
                                                    const initials = emp.full_name
                                                        .trim()
                                                        .split(/\s+/)
                                                        .map((w) => w[0])
                                                        .join('')
                                                        .slice(0, 2)
                                                        .toUpperCase();
                                                    const isSelected = receivedBy === emp.id;
                                                    return (
                                                        <CommandItem
                                                            key={emp.id}
                                                            value={emp.full_name}
                                                            onSelect={() => {
                                                                setReceivedBy(isSelected ? null : emp.id);
                                                                setEmpOpen(false);
                                                            }}
                                                            className="gap-2.5"
                                                        >
                                                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                                                                {initials}
                                                            </div>
                                                            <span className="flex-1 text-sm">{emp.full_name}</span>
                                                            {isSelected && <Check className="h-4 w-4 text-primary" />}
                                                        </CommandItem>
                                                    );
                                                })}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 shrink-0"
                                title="إضافة موظف جديد"
                                onClick={() => setShowAddEmployee(true)}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>

                        {employees.length === 0 && (
                            <p className="py-1 text-center text-xs text-muted-foreground">لا يوجد موظفون — أضف من قسم الموظفين أولاً</p>
                        )}
                        {errors.received_by && <p className="text-sm text-destructive">{errors.received_by}</p>}
                    </CardContent>
                </Card>

                {/* 3. وصف العطل */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                            وصف العطل / الصيانة المطلوبة <span className="text-destructive">*</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Textarea
                            className="min-h-[120px] resize-none text-base"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="مثال: تغيير زيت المحرك، تسريب في الفرامل..."
                            autoFocus
                        />
                        {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
                    </CardContent>
                </Card>

                {/* 4. القطع المستلمة */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            القطع المستلمة
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            ما استلمته الورشة فعليًا من العميل ضمن هذا القيد — مثال: موتور × 2، شاسيه × 1، بستون × 1.
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {receivedItems.map((row, idx) => (
                            <div key={idx} className="flex items-end gap-2">
                                <div className="flex-1 space-y-1.5">
                                    {idx === 0 && <Label className="text-sm font-medium">اسم القطعة</Label>}
                                    <Input
                                        className="min-h-[40px]"
                                        placeholder="مثال: موتور"
                                        value={row.item_name}
                                        onChange={(e) => updateReceivedItem(idx, 'item_name', e.target.value)}
                                    />
                                </div>
                                <div className="w-24 space-y-1.5">
                                    {idx === 0 && <Label className="text-sm font-medium">العدد</Label>}
                                    <Input
                                        type="number"
                                        min="1"
                                        step="1"
                                        className="min-h-[40px]"
                                        value={row.quantity}
                                        onChange={(e) => updateReceivedItem(idx, 'quantity', e.target.value)}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeReceivedItem(idx)}
                                    className="mb-2.5 text-muted-foreground transition-colors hover:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                        <Button type="button" variant="outline" className="w-full gap-2" onClick={addReceivedItem}>
                            <Plus className="h-4 w-4" />
                            إضافة قطعة مستلمة
                        </Button>
                    </CardContent>
                </Card>

                {/* 5. القطع (اختياري) */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            القطع المطلوبة (اختياري)
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">يمكن إضافتها الآن أو لاحقًا من صفحة القيد.</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {parts.map((row, idx) => (
                            <div key={idx} className="space-y-3 rounded-lg border p-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-muted-foreground">قطعة #{idx + 1}</span>
                                    <button
                                        type="button"
                                        onClick={() => removePart(idx)}
                                        className="text-muted-foreground transition-colors hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>

                                {/* جهة الشراء */}
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => updatePart(idx, 'purchased_by', 'customer')}
                                        className={cn(
                                            'cursor-pointer rounded-lg border px-3 py-2 text-sm font-semibold transition-all',
                                            row.purchased_by === 'customer'
                                                ? 'border-blue-400 bg-blue-50 text-blue-700 ring-2 ring-blue-400 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                                                : 'border-muted bg-muted/20 text-muted-foreground hover:bg-muted/50',
                                        )}
                                    >
                                        {row.purchased_by === 'customer' && <span className="me-1">✓</span>}
                                        العميل يشتري
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => updatePart(idx, 'purchased_by', 'company')}
                                        className={cn(
                                            'cursor-pointer rounded-lg border px-3 py-2 text-sm font-semibold transition-all',
                                            row.purchased_by === 'company'
                                                ? 'border-purple-400 bg-purple-50 text-purple-700 ring-2 ring-purple-400 dark:border-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
                                                : 'border-muted bg-muted/20 text-muted-foreground hover:bg-muted/50',
                                        )}
                                    >
                                        {row.purchased_by === 'company' && <span className="me-1">✓</span>}
                                        الورشة تشتري
                                    </button>
                                </div>

                                {/* الاسم + الكمية */}
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className={row.purchased_by === 'customer' ? 'space-y-1.5 sm:col-span-2' : 'space-y-1.5'}>
                                        <Label className="text-sm font-medium">
                                            اسم القطعة <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            className="min-h-[40px]"
                                            placeholder="اسم القطعة..."
                                            value={row.part_name}
                                            onChange={(e) => updatePart(idx, 'part_name', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-medium">
                                            الكمية <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            type="number"
                                            min="0.001"
                                            step="0.001"
                                            className="min-h-[40px]"
                                            value={row.quantity}
                                            onChange={(e) => updatePart(idx, 'quantity', e.target.value)}
                                        />
                                    </div>
                                </div>

                                {row.purchased_by === 'company' && (
                                    <>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div className="space-y-1.5">
                                                <Label className="text-sm font-medium">
                                                    سعر الشراء (داخلي) <span className="text-destructive">*</span>
                                                </Label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    className="min-h-[40px]"
                                                    placeholder="0.00"
                                                    value={row.unit_cost}
                                                    onChange={(e) => updatePart(idx, 'unit_cost', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-sm font-medium text-purple-700 dark:text-purple-400">
                                                    سعر البيع للعميل <span className="text-destructive">*</span>
                                                </Label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    className="min-h-[40px] border-purple-300 dark:border-purple-800"
                                                    placeholder="0.00"
                                                    value={row.unit_price}
                                                    onChange={(e) => updatePart(idx, 'unit_price', e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div className="space-y-1.5">
                                                <Label className="text-sm font-medium">المورد</Label>
                                                <div className="flex gap-2">
                                                    <Select
                                                        value={row.supplier_id === '' ? '__none__' : String(row.supplier_id)}
                                                        onValueChange={(v) => updatePart(idx, 'supplier_id', v === '__none__' ? '' : Number(v))}
                                                    >
                                                        <SelectTrigger className="min-h-[40px] flex-1">
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
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-10 w-10 shrink-0"
                                                        title="إضافة مورد جديد"
                                                        onClick={() => setNewSupplierForRow(newSupplierForRow === idx ? null : idx)}
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-sm font-medium">حالة الدفع</Label>
                                                <button
                                                    type="button"
                                                    onClick={() => updatePart(idx, 'is_paid', !row.is_paid)}
                                                    className={cn(
                                                        'flex min-h-[40px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold transition-all',
                                                        row.is_paid
                                                            ? 'border-green-300 bg-green-50 text-green-700 ring-2 ring-green-400 dark:border-green-700 dark:bg-green-950/40 dark:text-green-300'
                                                            : 'border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
                                                    )}
                                                >
                                                    {row.is_paid ? '✓ تم الدفع' : '⏳ لم يُدفع بعد'}
                                                </button>
                                            </div>
                                        </div>

                                        {newSupplierForRow === idx && (
                                            <div className="space-y-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs font-semibold text-primary">إضافة مورد جديد</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => setNewSupplierForRow(null)}
                                                        className="text-muted-foreground hover:text-foreground"
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                                <div className="flex flex-col gap-2 sm:flex-row">
                                                    <Input
                                                        autoFocus
                                                        placeholder="اسم المورد *"
                                                        value={newSupName}
                                                        onChange={(e) => setNewSupName(e.target.value)}
                                                        className="min-h-[38px] sm:w-1/2"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                createSupplierForRow();
                                                            }
                                                        }}
                                                    />
                                                    <Input
                                                        placeholder="الجوال"
                                                        dir="ltr"
                                                        value={newSupPhone}
                                                        onChange={(e) => setNewSupPhone(e.target.value)}
                                                        className="min-h-[38px] sm:w-1/2"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                createSupplierForRow();
                                                            }
                                                        }}
                                                    />
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        className="min-h-[38px] shrink-0"
                                                        disabled={creatingSupplier || !newSupName.trim()}
                                                        onClick={createSupplierForRow}
                                                    >
                                                        {creatingSupplier ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'إضافة'}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        ))}
                        <Button type="button" variant="outline" className="w-full gap-2" onClick={addPart}>
                            <Plus className="h-4 w-4" />
                            إضافة قطعة
                        </Button>
                    </CardContent>
                </Card>

                {/* 6. تفاصيل إضافية (اختياري، مطوي) */}
                <Card>
                    <button
                        type="button"
                        className="flex w-full items-center justify-between gap-2 p-4 text-start"
                        onClick={() => setShowExtra((v) => !v)}
                    >
                        <span className="flex items-center gap-2 text-base font-semibold">
                            <Settings2 className="h-4 w-4 text-muted-foreground" />
                            تفاصيل إضافية (اختياري)
                        </span>
                        {showExtra ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>

                    {showExtra && (
                        <CardContent className="space-y-5 border-t pt-4">
                            {/* ملاحظات */}
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium">ملاحظات</Label>
                                <Textarea
                                    className="min-h-[90px] resize-none text-sm"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="اكتب أي ملاحظات إضافية هنا..."
                                />
                            </div>
                        </CardContent>
                    )}
                </Card>

                {/* 7. دفعة مسبقة (اختياري) */}
                <Card>
                    <button
                        type="button"
                        className="flex w-full items-center justify-between gap-2 p-4 text-start"
                        onClick={() => setHasDeposit((v) => !v)}
                    >
                        <span className="flex items-center gap-2 text-base font-semibold">
                            <Wallet className="h-4 w-4 text-muted-foreground" />
                            هل دفع العميل مبلغًا مسبقًا؟ (اختياري)
                        </span>
                        <span
                            className={cn(
                                'flex h-6 w-11 shrink-0 items-center rounded-full border px-0.5 transition-colors',
                                hasDeposit ? 'justify-end border-green-400 bg-green-500' : 'justify-start border-muted bg-muted',
                            )}
                        >
                            <span className="h-4.5 w-4.5 rounded-full bg-white shadow" />
                        </span>
                    </button>

                    {hasDeposit && (
                        <CardContent className="space-y-4 border-t pt-4">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-medium">
                                        المبلغ المدفوع <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        className="min-h-[40px]"
                                        placeholder="0.00"
                                        value={depositAmount}
                                        onChange={(e) => setDepositAmount(e.target.value)}
                                    />
                                    {errors['deposit.amount'] && <p className="text-sm text-destructive">{errors['deposit.amount']}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-medium">طريقة الدفع</Label>
                                    <div className="grid grid-cols-3 gap-1.5">
                                        {(
                                            [
                                                { value: 'cash', label: 'نقدًا' },
                                                { value: 'whish', label: 'Whish' },
                                                { value: 'omt', label: 'OMT' },
                                            ] as const
                                        ).map((opt) => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setDepositMethod(opt.value)}
                                                className={cn(
                                                    'cursor-pointer rounded-lg border px-2 py-2 text-sm font-semibold transition-all',
                                                    depositMethod === opt.value
                                                        ? 'border-green-400 bg-green-50 text-green-700 ring-2 ring-green-400 dark:border-green-700 dark:bg-green-950/40 dark:text-green-300'
                                                        : 'border-muted bg-muted/20 text-muted-foreground hover:bg-muted/50',
                                                )}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium">الحساب المستلم للمبلغ</Label>
                                <Input
                                    className="min-h-[40px]"
                                    placeholder="مثال: صندوق الورشة، أو رقم حساب Whish..."
                                    value={depositAccount}
                                    onChange={(e) => setDepositAccount(e.target.value)}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium">حالة الحساب</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setDepositFullPayment(false)}
                                        className={cn(
                                            'cursor-pointer rounded-lg border px-3 py-2 text-sm font-semibold transition-all',
                                            !depositFullPayment
                                                ? 'border-orange-300 bg-orange-50 text-orange-700 ring-2 ring-orange-400 dark:border-orange-700 dark:bg-orange-950/40 dark:text-orange-300'
                                                : 'border-muted bg-muted/20 text-muted-foreground hover:bg-muted/50',
                                        )}
                                    >
                                        باقي على الحساب
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDepositFullPayment(true)}
                                        className={cn(
                                            'cursor-pointer rounded-lg border px-3 py-2 text-sm font-semibold transition-all',
                                            depositFullPayment
                                                ? 'border-green-300 bg-green-50 text-green-700 ring-2 ring-green-400 dark:border-green-700 dark:bg-green-950/40 dark:text-green-300'
                                                : 'border-muted bg-muted/20 text-muted-foreground hover:bg-muted/50',
                                        )}
                                    >
                                        تسكير الحساب
                                    </button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    يُحسب المتبقي فعليًا لاحقًا بعد تحديد تكلفة الصيانة الكاملة من صفحة القيد.
                                </p>
                            </div>
                        </CardContent>
                    )}
                </Card>

                {/* 8. حفظ */}
                <div className="flex flex-col gap-2.5 pt-1">
                    <Button type="submit" size="lg" className="min-h-[52px] w-full gap-2 text-base" disabled={processing}>
                        {processing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                        {processing ? 'جاري الحفظ...' : 'حفظ قيد الاستلام'}
                    </Button>
                    <Button type="button" variant="outline" size="lg" className="min-h-[52px] w-full text-base" onClick={() => window.history.back()}>
                        إلغاء
                    </Button>
                </div>
            </form>

            <EmployeesActionDialog open={showAddEmployee} onOpenChange={setShowAddEmployee} />
        </>
    );
}
