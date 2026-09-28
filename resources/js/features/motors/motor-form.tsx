import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useForm } from '@inertiajs/react';
import { CalendarCheck, Check, ChevronsUpDown, Loader2, Plus, Save, Tag, User, UserCheck, X } from 'lucide-react';
import { useState } from 'react';
import { CustomerCombobox, type CustomerOption } from './customer-combobox';

export interface EmployeeOption {
    id: number;
    full_name: string;
}

export interface CategoryOption {
    id: number;
    name: string;
    color: string | null;
}

interface Props {
    customers: CustomerOption[];
    categories: CategoryOption[];
    employees: EmployeeOption[];
    defaultValues?: {
        customer_id?: number | null;
        customer_name?: string;
        customer_phone?: string;
        category_id?: number | null;
        status?: string;
        notes?: string;
        delivered_at?: string;
        received_by?: number | null;
    };
    action: string;
    method?: 'post' | 'put';
    title: string;
    showDeliveredAt?: boolean;
}

const COLOR_HEX: Record<string, string> = {
    blue: '#3b82f6',
    indigo: '#6366f1',
    cyan: '#06b6d4',
    teal: '#14b8a6',
    sky: '#0ea5e9',
    green: '#22c55e',
    yellow: '#eab308',
    orange: '#f97316',
    red: '#ef4444',
    pink: '#ec4899',
    purple: '#a855f7',
    gray: '#6b7280',
};

const COLOR_PALETTE = Object.keys(COLOR_HEX);

function colorHex(color: string | null): string {
    return COLOR_HEX[color ?? 'gray'] ?? '#6b7280';
}

function getXsrfToken(): string {
    const match = document.cookie.split(';').find((c) => c.trim().startsWith('XSRF-TOKEN='));
    return match ? decodeURIComponent(match.trim().slice('XSRF-TOKEN='.length)) : '';
}

const statusOptions = [
    {
        value: 'in_workshop',
        label: 'في الورشة',
        color: 'border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:border-blue-700 dark:text-blue-300',
        active: 'ring-2 ring-blue-400',
    },
    {
        value: 'in_progress',
        label: 'قيد الإصلاح',
        color: 'border-yellow-300 bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:border-yellow-700 dark:text-yellow-300',
        active: 'ring-2 ring-yellow-400',
    },
    {
        value: 'ready',
        label: 'جاهز للاستلام',
        color: 'border-green-300 bg-green-50 text-green-700 dark:bg-green-950/40 dark:border-green-700 dark:text-green-300',
        active: 'ring-2 ring-green-400',
    },
    {
        value: 'delivered',
        label: 'تم التسليم',
        color: 'border-gray-300 bg-gray-50 text-gray-600 dark:bg-gray-800/40 dark:border-gray-600 dark:text-gray-300',
        active: 'ring-2 ring-gray-400',
    },
];

export function MotorForm({
    customers,
    categories: initialCategories,
    employees,
    defaultValues,
    action,
    method = 'post',
    title,
    showDeliveredAt,
}: Props) {
    const { data, setData, post, put, processing, errors } = useForm({
        customer_id: defaultValues?.customer_id ?? (null as number | null),
        customer_name: defaultValues?.customer_name ?? '',
        customer_phone: defaultValues?.customer_phone ?? '',
        category_id: defaultValues?.category_id ?? (null as number | null),
        status: defaultValues?.status ?? 'in_workshop',
        notes: defaultValues?.notes ?? '',
        delivered_at: defaultValues?.delivered_at ?? '',
        received_by: defaultValues?.received_by ?? (null as number | null),
    });

    const [cats, setCats] = useState<CategoryOption[]>(initialCategories);
    const [showAddCat, setShowAddCat] = useState(false);
    const [newCatName, setNewCatName] = useState('');
    const [newCatColor, setNewCatColor] = useState('blue');
    const [addingCat, setAddingCat] = useState(false);
    const [addCatError, setAddCatError] = useState('');
    const [empOpen, setEmpOpen] = useState(false);

    async function handleAddCat() {
        if (!newCatName.trim()) return;
        setAddingCat(true);
        setAddCatError('');
        try {
            const res = await fetch('/settings/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({ name: newCatName.trim(), color: newCatColor }),
            });
            const body = await res.json();
            if (!res.ok) {
                setAddCatError(body.errors?.name?.[0] ?? 'حدث خطأ');
                return;
            }
            const created: CategoryOption = { id: body.id, name: body.name, color: body.color };
            setCats((prev) => [...prev, created]);
            setData('category_id', created.id);
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
        if (method === 'put') put(action);
        else post(action);
    }

    return (
        <form onSubmit={submit} className="mx-auto max-w-5xl space-y-5 pb-10">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                <p className="mt-1 text-sm text-muted-foreground">أدخل البيانات والعميل المرتبط بالقيد</p>
            </div>

            <Separator />

            <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
                {/* ── Left column ── */}
                <div className="space-y-5">
                    {/* Customer */}
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
                                selectedId={data.customer_id}
                                newName={data.customer_name}
                                newPhone={data.customer_phone}
                                onSelectExisting={(c) =>
                                    setData((prev) => ({
                                        ...prev,
                                        customer_id: c.id || null,
                                        customer_name: c.name,
                                        customer_phone: c.phone,
                                    }))
                                }
                                onNewNameChange={(v) => setData('customer_name', v)}
                                onNewPhoneChange={(v) => setData('customer_phone', v)}
                                errors={errors as Record<string, string>}
                            />
                        </CardContent>
                    </Card>

                    {/* Status */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">
                                حالة القيد <span className="text-destructive">*</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                {statusOptions.map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setData('status', opt.value)}
                                        className={cn(
                                            'cursor-pointer rounded-lg border px-3 py-2.5 text-sm font-semibold transition-all',
                                            opt.color,
                                            data.status === opt.value && opt.active,
                                        )}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                            {errors.status && <p className="text-sm text-destructive">{errors.status}</p>}
                        </CardContent>
                    </Card>

                    {/* Notes */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">ملاحظات</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                id="notes"
                                className="min-h-[120px] resize-none"
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                placeholder="أي ملاحظات تخص هذا القيد..."
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* ── Right sidebar ── */}
                <div className="space-y-5">
                    {/* Category */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Tag className="h-4 w-4 text-muted-foreground" />
                                التصنيف
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => setData('category_id', null)}
                                    className={cn(
                                        'flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all select-none',
                                        data.category_id === null
                                            ? 'border-2 border-foreground/40 bg-muted shadow-sm'
                                            : 'border-muted bg-muted/20 text-muted-foreground hover:bg-muted/50',
                                    )}
                                >
                                    <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-muted-foreground/30" />
                                    بدون
                                    {data.category_id === null && <Check className="ms-1 h-3 w-3" />}
                                </button>

                                {cats.map((cat) => {
                                    const sel = data.category_id === cat.id;
                                    const hex = colorHex(cat.color);
                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setData('category_id', cat.id)}
                                            className={cn(
                                                'flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all select-none',
                                                sel ? 'border-2 shadow-sm' : 'border-muted bg-muted/20 text-muted-foreground hover:bg-muted/50',
                                            )}
                                            style={sel ? { borderColor: hex, backgroundColor: hex + '1a', color: hex } : undefined}
                                        >
                                            <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: hex }} />
                                            {cat.name}
                                            {sel && <Check className="ms-1 h-3 w-3" />}
                                        </button>
                                    );
                                })}

                                {!showAddCat && (
                                    <button
                                        type="button"
                                        onClick={() => setShowAddCat(true)}
                                        className="flex cursor-pointer items-center gap-1 rounded-lg border border-dashed border-primary/50 px-3 py-1.5 text-sm font-medium text-primary/70 transition-all hover:border-primary hover:bg-primary/5 hover:text-primary"
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                        إضافة
                                    </button>
                                )}
                            </div>

                            {showAddCat && (
                                <div className="space-y-2.5 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-3">
                                    <Input
                                        autoFocus
                                        placeholder="اسم التصنيف..."
                                        value={newCatName}
                                        onChange={(e) => setNewCatName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddCat();
                                            }
                                        }}
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
                                                    newCatColor === c
                                                        ? 'scale-110 border-foreground shadow'
                                                        : 'border-transparent hover:border-muted-foreground/50',
                                                )}
                                                style={{ backgroundColor: colorHex(c) }}
                                            />
                                        ))}
                                    </div>
                                    {addCatError && <p className="text-xs text-destructive">{addCatError}</p>}
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            className="h-8 gap-1 text-xs"
                                            disabled={!newCatName.trim() || addingCat}
                                            onClick={handleAddCat}
                                        >
                                            {addingCat ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                            إضافة
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 text-xs"
                                            onClick={() => {
                                                setShowAddCat(false);
                                                setNewCatName('');
                                                setAddCatError('');
                                            }}
                                        >
                                            <X className="me-1 h-3 w-3" />
                                            إلغاء
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Received by */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <UserCheck className="h-4 w-4 text-muted-foreground" />
                                المستلم
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {/* Selected employee display */}
                            {data.received_by !== null &&
                                (() => {
                                    const emp = employees.find((e) => e.id === data.received_by);
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
                                                onClick={() => setData('received_by', null)}
                                                className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    );
                                })()}

                            {/* Combobox trigger */}
                            <Popover open={empOpen} onOpenChange={setEmpOpen}>
                                <PopoverTrigger asChild>
                                    <button
                                        type="button"
                                        className={cn(
                                            'flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors',
                                            'hover:bg-muted/50 focus:ring-2 focus:ring-ring focus:outline-none',
                                            data.received_by !== null ? 'border-dashed text-muted-foreground' : 'text-muted-foreground',
                                        )}
                                    >
                                        <span>{data.received_by !== null ? 'تغيير المستلم' : 'اختر موظفاً مستلماً...'}</span>
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
                                                    const isSelected = data.received_by === emp.id;
                                                    return (
                                                        <CommandItem
                                                            key={emp.id}
                                                            value={emp.full_name}
                                                            onSelect={() => {
                                                                setData('received_by', isSelected ? null : emp.id);
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
                                <p className="py-1 text-center text-xs text-muted-foreground">لا يوجد موظفون — أضف من قسم الموظفين أولاً</p>
                            )}
                            {errors.received_by && <p className="text-sm text-destructive">{errors.received_by}</p>}
                        </CardContent>
                    </Card>

                    {/* Delivered at (edit only) */}
                    {showDeliveredAt && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                                    تاريخ التسليم
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Input
                                    id="delivered_at"
                                    type="date"
                                    className="min-h-[42px]"
                                    dir="ltr"
                                    value={data.delivered_at}
                                    onChange={(e) => setData('delivered_at', e.target.value)}
                                />
                            </CardContent>
                        </Card>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col gap-2.5">
                        <Button type="submit" size="lg" className="w-full gap-2" disabled={processing}>
                            {processing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                            {processing ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                        </Button>
                        <Button type="button" variant="outline" size="lg" className="w-full" onClick={() => window.history.back()}>
                            إلغاء
                        </Button>
                    </div>
                </div>
            </div>
        </form>
    );
}
