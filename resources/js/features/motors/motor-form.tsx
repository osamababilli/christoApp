import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useForm } from '@inertiajs/react';
import { CalendarCheck, Car, Loader2, Save, User } from 'lucide-react';
import { CustomerCombobox, type CustomerOption } from './customer-combobox';

interface Props {
    customers: CustomerOption[];
    defaultValues?: {
        customer_id?: number | null;
        customer_name?: string;
        customer_phone?: string;
        brand?: string;
        model?: string;
        status?: string;
        condition_rating?: string;
        notes?: string;
        delivered_at?: string;
    };
    action: string;
    method?: 'post' | 'put';
    title: string;
    showDeliveredAt?: boolean;
}

const statusOptions = [
    { value: 'in_workshop', label: 'في الورشة',        color: 'border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:border-blue-700 dark:text-blue-300',   active: 'ring-2 ring-blue-400'   },
    { value: 'in_progress', label: 'قيد الإصلاح',      color: 'border-yellow-300 bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:border-yellow-700 dark:text-yellow-300', active: 'ring-2 ring-yellow-400' },
    { value: 'ready',       label: 'جاهز للاستلام',    color: 'border-green-300 bg-green-50 text-green-700 dark:bg-green-950/40 dark:border-green-700 dark:text-green-300',   active: 'ring-2 ring-green-400'  },
    { value: 'delivered',   label: 'تم التسليم',        color: 'border-gray-300 bg-gray-50 text-gray-600 dark:bg-gray-800/40 dark:border-gray-600 dark:text-gray-300',        active: 'ring-2 ring-gray-400'   },
];

const conditionOptions = [
    { value: 'excellent', label: 'ممتاز', color: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-300', active: 'ring-2 ring-emerald-400' },
    { value: 'good',      label: 'جيد',   color: 'border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:border-blue-700 dark:text-blue-300',                   active: 'ring-2 ring-blue-400'    },
    { value: 'fair',      label: 'مقبول', color: 'border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-300',             active: 'ring-2 ring-amber-400'   },
    { value: 'poor',      label: 'ضعيف',  color: 'border-red-300 bg-red-50 text-red-700 dark:bg-red-950/40 dark:border-red-700 dark:text-red-300',                         active: 'ring-2 ring-red-400'     },
];

export function MotorForm({ customers, defaultValues, action, method = 'post', title, showDeliveredAt }: Props) {
    const { data, setData, post, put, processing, errors } = useForm({
        customer_id:      defaultValues?.customer_id ?? null as number | null,
        customer_name:    defaultValues?.customer_name ?? '',
        customer_phone:   defaultValues?.customer_phone ?? '',
        brand:            defaultValues?.brand ?? '',
        model:            defaultValues?.model ?? '',
        status:           defaultValues?.status ?? 'in_workshop',
        condition_rating: defaultValues?.condition_rating ?? '',
        notes:            defaultValues?.notes ?? '',
        delivered_at:     defaultValues?.delivered_at ?? '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        method === 'put' ? put(action) : post(action);
    }

    return (
        <form onSubmit={submit} className="mx-auto max-w-3xl space-y-6">

            {/* Page title */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                <p className="mt-1 text-muted-foreground">أدخل بيانات الموتور والعميل المرتبط به</p>
            </div>

            <Separator />

            {/* ── Customer ── */}
            <section className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 mb-1">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <User className="h-4 w-4 text-primary" />
                    </span>
                    <h2 className="text-lg font-semibold">بيانات العميل</h2>
                </div>
                <CustomerCombobox
                    customers={customers}
                    selectedId={data.customer_id}
                    newName={data.customer_name}
                    newPhone={data.customer_phone}
                    onSelectExisting={(c) =>
                        setData((prev) => ({
                            ...prev,
                            customer_id:    c.id || null,
                            customer_name:  c.name,
                            customer_phone: c.phone,
                        }))
                    }
                    onNewNameChange={(v) => setData('customer_name', v)}
                    onNewPhoneChange={(v) => setData('customer_phone', v)}
                    errors={errors as any}
                />
            </section>

            {/* ── Motor info ── */}
            <section className="rounded-xl border bg-card p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-2 mb-1">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <Car className="h-4 w-4 text-primary" />
                    </span>
                    <h2 className="text-lg font-semibold">بيانات الموتور</h2>
                </div>

                {/* Brand + Model */}
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="brand" className="font-medium">الماركة</Label>
                        <Input
                            id="brand"
                            className="min-h-[44px]"
                            value={data.brand}
                            onChange={(e) => setData('brand', e.target.value)}
                            placeholder="مثال: هوندا"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="model" className="font-medium">الموديل</Label>
                        <Input
                            id="model"
                            className="min-h-[44px]"
                            value={data.model}
                            onChange={(e) => setData('model', e.target.value)}
                            placeholder="مثال: CG 125"
                        />
                    </div>
                </div>

                {/* Status — visual radio cards */}
                <div className="space-y-3">
                    <Label className="font-medium">
                        حالة الموتور <span className="text-destructive">*</span>
                    </Label>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {statusOptions.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => setData('status', opt.value)}
                                className={cn(
                                    'rounded-lg border px-3 py-2.5 text-sm font-semibold transition-all cursor-pointer',
                                    opt.color,
                                    data.status === opt.value && opt.active,
                                )}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                    {errors.status && <p className="text-sm text-destructive">{errors.status}</p>}
                </div>

                {/* Condition — visual chips */}
                <div className="space-y-3">
                    <Label className="font-medium">الحالة الفنية</Label>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setData('condition_rating', '')}
                            className={cn(
                                'rounded-full border px-4 py-1.5 text-sm font-medium transition-all cursor-pointer',
                                'border-muted-foreground/30 bg-muted text-muted-foreground',
                                data.condition_rating === '' && 'ring-2 ring-muted-foreground/50',
                            )}
                        >
                            غير محدد
                        </button>
                        {conditionOptions.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => setData('condition_rating', opt.value)}
                                className={cn(
                                    'rounded-full border px-4 py-1.5 text-sm font-medium transition-all cursor-pointer',
                                    opt.color,
                                    data.condition_rating === opt.value && opt.active,
                                )}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Delivered at — edit only */}
                {showDeliveredAt && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                            <Label htmlFor="delivered_at" className="font-medium">تاريخ التسليم</Label>
                        </div>
                        <Input
                            id="delivered_at"
                            type="date"
                            className="min-h-[44px] max-w-xs"
                            dir="ltr"
                            value={data.delivered_at}
                            onChange={(e) => setData('delivered_at', e.target.value)}
                        />
                    </div>
                )}
            </section>

            {/* ── Notes ── */}
            <section className="rounded-xl border bg-card p-6 shadow-sm space-y-3">
                <Label htmlFor="notes" className="font-medium">ملاحظات إضافية</Label>
                <Textarea
                    id="notes"
                    className="min-h-[110px] resize-none"
                    value={data.notes}
                    onChange={(e) => setData('notes', e.target.value)}
                    placeholder="أي ملاحظات تخص هذا الموتور..."
                />
            </section>

            {/* ── Actions ── */}
            <div className="flex gap-3 pb-8">
                <Button type="submit" size="lg" className="min-h-12 flex-1 gap-2 text-base" disabled={processing}>
                    {processing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    {processing ? 'جاري الحفظ...' : 'حفظ'}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="min-h-12 px-8 text-base"
                    onClick={() => window.history.back()}
                >
                    إلغاء
                </Button>
            </div>
        </form>
    );
}
