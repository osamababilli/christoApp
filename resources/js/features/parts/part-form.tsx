import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { router, useForm } from '@inertiajs/react';
import { Loader2, Plus, Save, X } from 'lucide-react';
import { useState } from 'react';

interface SupplierOption {
    id: number;
    name: string;
}

interface Props {
    maintenanceId: number;
    suppliers: SupplierOption[];
    onCancel?: () => void;
}

export function PartForm({ maintenanceId, suppliers, onCancel }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        maintenance_id: maintenanceId,
        part_name: '',
        type: 'part',
        quantity: '1',
        unit_cost: '',
        unit_price: '',
        is_paid: false as boolean,
        supplier_id: '' as string | number,
        purchased_by: 'customer' as 'customer' | 'company',
    });

    const [showNewSupplier, setShowNewSupplier] = useState(false);
    const [newSupName, setNewSupName] = useState('');
    const [newSupPhone, setNewSupPhone] = useState('');
    const [creatingSupplier, setCreatingSupplier] = useState(false);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/parts', {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onCancel?.();
            },
        });
    }

    function createSupplier() {
        if (!newSupName.trim()) return;
        setCreatingSupplier(true);
        router.post(
            '/suppliers',
            { name: newSupName, phone: newSupPhone },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    setShowNewSupplier(false);
                    setNewSupName('');
                    setNewSupPhone('');
                },
                onFinish: () => setCreatingSupplier(false),
            },
        );
    }

    return (
        <form onSubmit={submit} className="space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="font-semibold">إضافة قطعة / مستلزم</h4>
                {onCancel && (
                    <button type="button" onClick={onCancel} className="text-muted-foreground transition-colors hover:text-foreground">
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Purchased by */}
            <div className="space-y-1.5">
                <Label className="text-sm font-medium">جهة الشراء</Label>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            setData('purchased_by', 'customer');
                            setData('is_paid', true);
                            setShowNewSupplier(false);
                        }}
                        className={cn(
                            'cursor-pointer rounded-lg border px-3 py-2 text-sm font-semibold transition-all',
                            data.purchased_by === 'customer'
                                ? 'border-blue-400 bg-blue-50 text-blue-700 ring-2 ring-blue-400 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                                : 'border-muted bg-muted/20 text-muted-foreground hover:bg-muted/50',
                        )}
                    >
                        {data.purchased_by === 'customer' && <span className="me-1">✓</span>}
                        العميل يشتري
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setData('purchased_by', 'company');
                            setData('is_paid', false);
                        }}
                        className={cn(
                            'cursor-pointer rounded-lg border px-3 py-2 text-sm font-semibold transition-all',
                            data.purchased_by === 'company'
                                ? 'border-purple-400 bg-purple-50 text-purple-700 ring-2 ring-purple-400 dark:border-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
                                : 'border-muted bg-muted/20 text-muted-foreground hover:bg-muted/50',
                        )}
                    >
                        {data.purchased_by === 'company' && <span className="me-1">✓</span>}
                        الشركة تشتري
                    </button>
                </div>
            </div>

            {/* Name + Quantity + Prices */}
            <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor={`pf-name-${maintenanceId}`} className="text-sm font-medium">
                        الاسم <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id={`pf-name-${maintenanceId}`}
                        className="min-h-[40px]"
                        value={data.part_name}
                        onChange={(e) => setData('part_name', e.target.value)}
                        placeholder="اسم القطعة..."
                        autoFocus
                    />
                    {errors.part_name && <p className="text-xs text-destructive">{errors.part_name}</p>}
                </div>
                <div className={data.purchased_by === 'customer' ? 'space-y-1.5 sm:col-span-2' : 'space-y-1.5'}>
                    <Label htmlFor={`pf-qty-${maintenanceId}`} className="text-sm font-medium">
                        الكمية <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id={`pf-qty-${maintenanceId}`}
                        type="number"
                        min="0.001"
                        step="0.001"
                        className="min-h-[40px]"
                        value={data.quantity}
                        onChange={(e) => setData('quantity', e.target.value)}
                    />
                    {errors.quantity && <p className="text-xs text-destructive">{errors.quantity}</p>}
                </div>
                {data.purchased_by === 'company' && (
                    <div className="space-y-1.5">
                        <Label htmlFor={`pf-cost-${maintenanceId}`} className="text-sm font-medium">
                            سعر الشراء (داخلي) <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id={`pf-cost-${maintenanceId}`}
                            type="number"
                            min="0"
                            step="0.01"
                            className="min-h-[40px]"
                            value={data.unit_cost}
                            onChange={(e) => setData('unit_cost', e.target.value)}
                            placeholder="0.00"
                        />
                        {errors.unit_cost && <p className="text-xs text-destructive">{errors.unit_cost}</p>}
                    </div>
                )}
            </div>

            {/* Selling price — only when company buys */}
            {data.purchased_by === 'company' && (
                <div className="rounded-lg border border-purple-200 bg-purple-50/50 p-3 dark:border-purple-900 dark:bg-purple-950/20">
                    <div className="space-y-1.5">
                        <Label htmlFor={`pf-price-${maintenanceId}`} className="text-sm font-medium text-purple-700 dark:text-purple-400">
                            سعر البيع للعميل <span className="text-destructive">*</span>
                            <span className="ms-2 text-xs font-normal text-muted-foreground">(يظهر في الفاتورة)</span>
                        </Label>
                        <Input
                            id={`pf-price-${maintenanceId}`}
                            type="number"
                            min="0"
                            step="0.01"
                            className="min-h-[40px] border-purple-300 bg-white dark:bg-background"
                            value={data.unit_price}
                            onChange={(e) => setData('unit_price', e.target.value)}
                            placeholder="0.00"
                        />
                        {data.unit_cost && data.unit_price && Number(data.unit_price) > Number(data.unit_cost) && (
                            <p className="text-xs text-purple-600 dark:text-purple-400">
                                الربح: {(Number(data.unit_price) - Number(data.unit_cost)).toFixed(2)} لكل وحدة
                            </p>
                        )}
                        {errors.unit_price && <p className="text-xs text-destructive">{errors.unit_price}</p>}
                    </div>
                </div>
            )}

            {/* Supplier + Paid — hidden when customer buys */}
            {data.purchased_by === 'company' && (
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label className="text-sm font-medium">المورد</Label>
                        <div className="flex gap-2">
                            <Select
                                value={data.supplier_id === '' ? '__none__' : String(data.supplier_id)}
                                onValueChange={(v) => setData('supplier_id', v === '__none__' ? '' : Number(v))}
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
                                onClick={() => setShowNewSupplier(!showNewSupplier)}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-sm font-medium">حالة الدفع</Label>
                        <button
                            type="button"
                            onClick={() => setData('is_paid', !data.is_paid)}
                            className={cn(
                                'flex min-h-[40px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold transition-all',
                                data.is_paid
                                    ? 'border-green-300 bg-green-50 text-green-700 ring-2 ring-green-400 dark:border-green-700 dark:bg-green-950/40 dark:text-green-300'
                                    : 'border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
                            )}
                        >
                            {data.is_paid ? '✓ تم الدفع' : '⏳ لم يُدفع بعد'}
                        </button>
                    </div>
                </div>
            )}

            {/* Inline new supplier */}
            {showNewSupplier && (
                <div className="space-y-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-primary">إضافة مورد جديد</p>
                        <button type="button" onClick={() => setShowNewSupplier(false)} className="text-muted-foreground hover:text-foreground">
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Input
                            autoFocus
                            placeholder="اسم المورد *"
                            value={newSupName}
                            onChange={(e) => setNewSupName(e.target.value)}
                            className="min-h-[38px] w-full sm:w-1/2"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    createSupplier();
                                }
                            }}
                        />
                        <Input
                            placeholder="الجوال"
                            dir="ltr"
                            value={newSupPhone}
                            onChange={(e) => setNewSupPhone(e.target.value)}
                            className="min-h-[38px] w-full sm:w-1/2"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    createSupplier();
                                }
                            }}
                        />
                        <Button
                            type="button"
                            size="sm"
                            className="min-h-[38px] shrink-0"
                            disabled={creatingSupplier || !newSupName.trim()}
                            onClick={createSupplier}
                        >
                            {creatingSupplier ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'إضافة'}
                        </Button>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
                <Button type="submit" size="sm" className="min-h-10 flex-1 gap-2" disabled={processing}>
                    {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {processing ? 'جاري الحفظ...' : 'إضافة القطعة'}
                </Button>
                {onCancel && (
                    <Button type="button" variant="outline" size="sm" className="min-h-10 px-5" onClick={onCancel}>
                        إلغاء
                    </Button>
                )}
            </div>
        </form>
    );
}
