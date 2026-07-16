import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { Check, ChevronDown, ChevronsUpDown, ChevronUp, Loader2, Package, Plus, Save, Settings2, Tag, Trash2, User, UserCheck, X } from 'lucide-react';
import { useState } from 'react';
import { CustomerCombobox, type CustomerOption } from './customer-combobox';
import type { CategoryOption, EmployeeOption } from './motor-form';

interface SupplierOption { id: number; name: string }

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

interface Props {
    customers: CustomerOption[];
    categories: CategoryOption[];
    employees: EmployeeOption[];
    suppliers: SupplierOption[];
}

const partTypeOptions = [
    { value: 'part',      label: 'قطعة',    color: 'border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:border-blue-700 dark:text-blue-300',       active: 'ring-2 ring-blue-400'   },
    { value: 'oil',       label: 'زيت',     color: 'border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-300', active: 'ring-2 ring-amber-400'  },
    { value: 'transport', label: 'نقل',     color: 'border-purple-300 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:border-purple-700 dark:text-purple-300', active: 'ring-2 ring-purple-400' },
    { value: 'cleaning',  label: 'تنظيف',   color: 'border-cyan-300 bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:border-cyan-700 dark:text-cyan-300',       active: 'ring-2 ring-cyan-400'   },
    { value: 'other',     label: 'أخرى',    color: 'border-gray-300 bg-gray-50 text-gray-700 dark:bg-gray-800/40 dark:border-gray-600 dark:text-gray-300',       active: 'ring-2 ring-gray-400'   },
];

function emptyPartRow(): PartRow {
    return { part_name: '', type: 'part', quantity: '1', purchased_by: 'customer', unit_cost: '', unit_price: '', supplier_id: '', is_paid: false };
}

const COLOR_HEX: Record<string, string> = {
    blue:   '#3b82f6',
    indigo: '#6366f1',
    cyan:   '#06b6d4',
    teal:   '#14b8a6',
    sky:    '#0ea5e9',
    green:  '#22c55e',
    yellow: '#eab308',
    orange: '#f97316',
    red:    '#ef4444',
    pink:   '#ec4899',
    purple: '#a855f7',
    gray:   '#6b7280',
};

const COLOR_PALETTE = Object.keys(COLOR_HEX);

function colorHex(color: string | null): string {
    return COLOR_HEX[color ?? 'gray'] ?? '#6b7280';
}

function getXsrfToken(): string {
    const match = document.cookie.split(';').find((c) => c.trim().startsWith('XSRF-TOKEN='));
    return match ? decodeURIComponent(match.trim().slice('XSRF-TOKEN='.length)) : '';
}

export function MotorIntakeForm({ customers, categories: initialCategories, employees, suppliers }: Props) {
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors]         = useState<Record<string, string>>({});

    const [customerId, setCustomerId]       = useState<number | null>(null);
    const [customerName, setCustomerName]   = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [description, setDescription]     = useState('');
    const [laborCost, setLaborCost]         = useState('');
    const [parts, setParts]                 = useState<PartRow[]>([]);

    // ── مورد جديد (يُفتح لصف قطعة محدد) ──
    const [newSupplierForRow, setNewSupplierForRow] = useState<number | null>(null);
    const [newSupName, setNewSupName]     = useState('');
    const [newSupPhone, setNewSupPhone]   = useState('');
    const [creatingSupplier, setCreatingSupplier] = useState(false);

    // ── تفاصيل إضافية (اختياري) ──
    const [showExtra, setShowExtra]     = useState(false);
    const [categoryId, setCategoryId]   = useState<number | null>(null);
    const [receivedBy, setReceivedBy]   = useState<number | null>(null);
    const [cats, setCats]               = useState<CategoryOption[]>(initialCategories);
    const [showAddCat, setShowAddCat]   = useState(false);
    const [newCatName, setNewCatName]   = useState('');
    const [newCatColor, setNewCatColor] = useState('blue');
    const [addingCat, setAddingCat]     = useState(false);
    const [addCatError, setAddCatError] = useState('');
    const [empOpen, setEmpOpen]         = useState(false);

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

    async function handleAddCat() {
        if (!newCatName.trim()) return;
        setAddingCat(true);
        setAddCatError('');
        try {
            const res = await fetch('/settings/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({ name: newCatName.trim(), color: newCatColor }),
            });
            const body = await res.json();
            if (!res.ok) { setAddCatError(body.errors?.name?.[0] ?? 'حدث خطأ'); return; }
            const created: CategoryOption = { id: body.id, name: body.name, color: body.color };
            setCats((prev) => [...prev, created]);
            setCategoryId(created.id);
            setShowAddCat(false);
            setNewCatName('');
            setNewCatColor('blue');
        } catch {
            setAddCatError('حدث خطأ في الاتصال');
        } finally {
            setAddingCat(false);
        }
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        const payload = {
            customer_id: customerId,
            customer_name: customerName,
            customer_phone: customerPhone,
            category_id: categoryId,
            received_by: receivedBy,
            description,
            labor_cost: laborCost,
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
                        errors={errors as any}
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
                    {receivedBy !== null && (() => {
                        const emp = employees.find((e) => e.id === receivedBy);
                        if (!emp) return null;
                        const initials = emp.full_name.trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
                        return (
                            <div className="flex items-center justify-between rounded-xl border bg-muted/40 px-3 py-2.5">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                                        {initials}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold leading-tight">{emp.full_name}</p>
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

                    <Popover open={empOpen} onOpenChange={setEmpOpen}>
                        <PopoverTrigger asChild>
                            <button
                                type="button"
                                className={cn(
                                    'flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors',
                                    'hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring',
                                    receivedBy !== null ? 'border-dashed text-muted-foreground' : 'text-muted-foreground',
                                )}
                            >
                                <span>{receivedBy !== null ? 'تغيير المستلم' : 'اختر موظفاً مستلماً...'}</span>
                                <ChevronsUpDown className="h-4 w-4 opacity-50" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[280px] p-0" align="start">
                            <Command>
                                <CommandInput placeholder="ابحث عن موظف..." />
                                <CommandList>
                                    <CommandEmpty>لا يوجد موظف بهذا الاسم.</CommandEmpty>
                                    <CommandGroup>
                                        {employees.map((emp) => {
                                            const initials = emp.full_name.trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
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

                    {employees.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-1">
                            لا يوجد موظفون — أضف من قسم الموظفين أولاً
                        </p>
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

                    <div className="space-y-1.5">
                        <Label className="text-sm font-medium">تكلفة العمالة</Label>
                        <Input
                            type="number"
                            min="0"
                            step="0.01"
                            className="min-h-[44px] text-base"
                            placeholder="0.00"
                            value={laborCost}
                            onChange={(e) => setLaborCost(e.target.value)}
                        />
                        {errors.labor_cost && <p className="text-sm text-destructive">{errors.labor_cost}</p>}
                    </div>
                </CardContent>
            </Card>

            {/* 4. القطع (اختياري) */}
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

                            {/* النوع */}
                            <div className="flex flex-wrap gap-2">
                                {partTypeOptions.map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => updatePart(idx, 'type', opt.value)}
                                        className={cn(
                                            'rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer',
                                            opt.color,
                                            row.type === opt.value && opt.active,
                                        )}
                                    >
                                        {row.type === opt.value && <span className="me-1">✓</span>}
                                        {opt.label}
                                    </button>
                                ))}
                            </div>

                            {/* جهة الشراء */}
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => updatePart(idx, 'purchased_by', 'customer')}
                                    className={cn(
                                        'rounded-lg border px-3 py-2 text-sm font-semibold transition-all cursor-pointer',
                                        row.purchased_by === 'customer'
                                            ? 'border-blue-400 bg-blue-50 text-blue-700 ring-2 ring-blue-400 dark:bg-blue-950/40 dark:border-blue-700 dark:text-blue-300'
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
                                        'rounded-lg border px-3 py-2 text-sm font-semibold transition-all cursor-pointer',
                                        row.purchased_by === 'company'
                                            ? 'border-purple-400 bg-purple-50 text-purple-700 ring-2 ring-purple-400 dark:bg-purple-950/40 dark:border-purple-700 dark:text-purple-300'
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
                                                    'flex w-full items-center justify-center gap-2 rounded-lg border px-3 min-h-[40px] text-sm font-semibold transition-all cursor-pointer',
                                                    row.is_paid
                                                        ? 'border-green-300 bg-green-50 text-green-700 dark:bg-green-950/40 dark:border-green-700 dark:text-green-300 ring-2 ring-green-400'
                                                        : 'border-orange-300 bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:border-orange-700 dark:text-orange-300',
                                                )}
                                            >
                                                {row.is_paid ? '✓ تم الدفع' : '⏳ لم يُدفع بعد'}
                                            </button>
                                        </div>
                                    </div>

                                    {newSupplierForRow === idx && (
                                        <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-semibold text-primary">إضافة مورد جديد</p>
                                                <button type="button" onClick={() => setNewSupplierForRow(null)} className="text-muted-foreground hover:text-foreground">
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                            <div className="flex gap-2">
                                                <Input
                                                    autoFocus
                                                    placeholder="اسم المورد *"
                                                    value={newSupName}
                                                    onChange={(e) => setNewSupName(e.target.value)}
                                                    className="min-h-[38px] w-1/2"
                                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); createSupplierForRow(); } }}
                                                />
                                                <Input
                                                    placeholder="الجوال"
                                                    dir="ltr"
                                                    value={newSupPhone}
                                                    onChange={(e) => setNewSupPhone(e.target.value)}
                                                    className="min-h-[38px] w-1/2"
                                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); createSupplierForRow(); } }}
                                                />
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    className="shrink-0 min-h-[38px]"
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

            {/* 5. تفاصيل إضافية (اختياري، مطوي) */}
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
                        {/* التصنيف */}
                        <div className="space-y-3">
                            <Label className="flex items-center gap-2 text-sm">
                                <Tag className="h-4 w-4 text-muted-foreground" />
                                التصنيف
                            </Label>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => setCategoryId(null)}
                                    className={cn(
                                        'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all cursor-pointer select-none',
                                        categoryId === null
                                            ? 'border-2 border-foreground/40 bg-muted shadow-sm'
                                            : 'border-muted bg-muted/20 text-muted-foreground hover:bg-muted/50',
                                    )}
                                >
                                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-muted-foreground/30 shrink-0" />
                                    بدون
                                    {categoryId === null && <Check className="ms-1 h-3 w-3" />}
                                </button>

                                {cats.map((cat) => {
                                    const sel = categoryId === cat.id;
                                    const hex = colorHex(cat.color);
                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setCategoryId(cat.id)}
                                            className={cn(
                                                'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all cursor-pointer select-none',
                                                sel ? 'border-2 shadow-sm' : 'border-muted bg-muted/20 text-muted-foreground hover:bg-muted/50',
                                            )}
                                            style={sel ? { borderColor: hex, backgroundColor: hex + '1a', color: hex } : undefined}
                                        >
                                            <span className="inline-block h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: hex }} />
                                            {cat.name}
                                            {sel && <Check className="ms-1 h-3 w-3" />}
                                        </button>
                                    );
                                })}

                                {!showAddCat && (
                                    <button
                                        type="button"
                                        onClick={() => setShowAddCat(true)}
                                        className="flex items-center gap-1 rounded-lg border border-dashed border-primary/50 px-3 py-1.5 text-sm font-medium text-primary/70 transition-all cursor-pointer hover:border-primary hover:text-primary hover:bg-primary/5"
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                        إضافة
                                    </button>
                                )}
                            </div>

                            {showAddCat && (
                                <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-3 space-y-2.5">
                                    <Input
                                        autoFocus
                                        placeholder="اسم التصنيف..."
                                        value={newCatName}
                                        onChange={(e) => setNewCatName(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCat(); } }}
                                        className="min-h-[38px] text-sm"
                                    />
                                    <div className="flex flex-wrap gap-1.5">
                                        {COLOR_PALETTE.map((c) => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => setNewCatColor(c)}
                                                title={c}
                                                className={cn(
                                                    'h-6 w-6 rounded-full border-2 transition-all',
                                                    newCatColor === c ? 'border-foreground scale-110 shadow' : 'border-transparent hover:border-muted-foreground/50',
                                                )}
                                                style={{ backgroundColor: colorHex(c) }}
                                            />
                                        ))}
                                    </div>
                                    {addCatError && <p className="text-xs text-destructive">{addCatError}</p>}
                                    <div className="flex gap-2">
                                        <Button type="button" size="sm" className="h-8 gap-1 text-xs" disabled={!newCatName.trim() || addingCat} onClick={handleAddCat}>
                                            {addingCat ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                            إضافة
                                        </Button>
                                        <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setShowAddCat(false); setNewCatName(''); setAddCatError(''); }}>
                                            <X className="h-3 w-3 me-1" />
                                            إلغاء
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                )}
            </Card>

            {/* 6. حفظ */}
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
    );
}
