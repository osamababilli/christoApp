import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Link, router } from '@inertiajs/react';
import { Loader2, Minus, Plus, Save, Send, Wrench, Package } from 'lucide-react';
import { useState } from 'react';
import { CustomerCombobox, type CustomerOption } from '../motors/customer-combobox';

type ServiceRow = { description: string; labor_cost: string };
type PartRow    = { description: string; quantity: string; unit_price: string };

interface QuotationData {
    id?: number;
    customer_id?: number | null;
    customer_name?: string;
    customer_phone?: string;
    notes?: string;
    valid_days?: number;
    services?: ServiceRow[];
    parts?: PartRow[];
}

interface Props {
    quotation?: QuotationData;
    customers: CustomerOption[];
    isEdit?: boolean;
}

export function QuotationForm({ quotation, customers, isEdit = false }: Props) {
    const [processing, setProcessing] = useState(false);
    const [errors,     setErrors]     = useState<Record<string, string>>({});

    const [customer_id,    setCustomerId]    = useState<number | null>(quotation?.customer_id ?? null);
    const [customer_name,  setCustomerName]  = useState(quotation?.customer_name  ?? '');
    const [customer_phone, setCustomerPhone] = useState(quotation?.customer_phone ?? '');
    const [notes,          setNotes]          = useState(quotation?.notes          ?? '');
    const [valid_days,     setValidDays]      = useState(quotation?.valid_days     ?? 15);
    const [services,       setServices]       = useState<ServiceRow[]>(
        quotation?.services ?? [{ description: '', labor_cost: '' }],
    );
    const [parts,          setParts]          = useState<PartRow[]>(
        quotation?.parts ?? [],
    );

    /* ── Services ── */
    function addService() {
        setServices((prev) => [...prev, { description: '', labor_cost: '' }]);
    }

    function removeService(idx: number) {
        setServices((prev) => prev.filter((_, i) => i !== idx));
    }

    function updateService(idx: number, field: keyof ServiceRow, value: string) {
        setServices((prev) => prev.map((row, i) => i === idx ? { ...row, [field]: value } : row));
    }

    /* ── Parts ── */
    function addPart() {
        setParts((prev) => [...prev, { description: '', quantity: '1', unit_price: '' }]);
    }

    function removePart(idx: number) {
        setParts((prev) => prev.filter((_, i) => i !== idx));
    }

    function updatePart(idx: number, field: keyof PartRow, value: string) {
        setParts((prev) => prev.map((row, i) => i === idx ? { ...row, [field]: value } : row));
    }

    function partTotal(part: PartRow): string {
        const qty   = parseFloat(part.quantity)  || 0;
        const price = parseFloat(part.unit_price) || 0;
        return (qty * price).toFixed(2);
    }

    /* ── Totals ── */
    const totalServices = services.reduce((s, row) => s + (parseFloat(row.labor_cost) || 0), 0);
    const totalParts    = parts.reduce((s, row) => {
        return s + (parseFloat(row.quantity) || 0) * (parseFloat(row.unit_price) || 0);
    }, 0);
    const grandTotal = totalServices + totalParts;

    /* ── Submit ── */
    function buildPayload(status: string) {
        return {
            customer_id,
            customer_name,
            customer_phone,
            notes,
            valid_days,
            status,
            services: services.map((s) => ({ description: s.description, labor_cost: s.labor_cost })),
            parts:    parts.map((p) => ({
                description: p.description,
                quantity:    p.quantity,
                unit_price:  p.unit_price,
            })),
        };
    }

    function submit(e: React.FormEvent, status: string) {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        const action  = isEdit ? `/quotations/${quotation?.id}` : '/quotations';
        const payload = buildPayload(status);

        const options = {
            onError: (errs: Record<string, string>) => {
                setErrors(errs);
                setProcessing(false);
            },
            onFinish: () => setProcessing(false),
        };

        if (isEdit) {
            router.put(action, payload, options);
        } else {
            router.post(action, payload, options);
        }
    }

    return (
        <form onSubmit={(e) => submit(e, 'draft')} className="mx-auto max-w-5xl space-y-5 pb-10">

            <div>
                <h1 className="text-2xl font-bold tracking-tight">
                    {isEdit ? 'تعديل عرض السعر' : 'إنشاء عرض سعر جديد'}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    أدخل بيانات العميل والخدمات والقطع المطلوبة
                </p>
            </div>

            <Separator />

            <div className="grid gap-5 lg:grid-cols-[1fr_320px]">

                {/* ── Left column ── */}
                <div className="space-y-5">

                    {/* Customer */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">بيانات العميل</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CustomerCombobox
                                customers={customers}
                                selectedId={customer_id}
                                newName={customer_name}
                                newPhone={customer_phone}
                                onSelectExisting={(c) => {
                                    setCustomerId(c.id || null);
                                    setCustomerName(c.name);
                                    setCustomerPhone(c.phone);
                                }}
                                onNewNameChange={setCustomerName}
                                onNewPhoneChange={setCustomerPhone}
                                errors={{
                                    customer_id:    errors.customer_id,
                                    customer_name:  errors.customer_name,
                                    customer_phone: errors.customer_phone,
                                }}
                            />
                        </CardContent>
                    </Card>

                    {/* Services */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Wrench className="h-4 w-4 text-muted-foreground" />
                                خدمات الصيانة
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {services.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-2">لا توجد خدمات بعد</p>
                            )}
                            {services.map((svc, idx) => (
                                <div key={idx} className="flex gap-2 items-start">
                                    <div className="flex-1 space-y-1">
                                        <Input
                                            placeholder="وصف الخدمة..."
                                            value={svc.description}
                                            onChange={(e) => updateService(idx, 'description', e.target.value)}
                                            className="min-h-[42px]"
                                        />
                                        {errors[`services.${idx}.description`] && (
                                            <p className="text-xs text-destructive">{errors[`services.${idx}.description`]}</p>
                                        )}
                                    </div>
                                    <div className="w-36 space-y-1">
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="تكلفة العمالة"
                                            value={svc.labor_cost}
                                            onChange={(e) => updateService(idx, 'labor_cost', e.target.value)}
                                            className="min-h-[42px]"
                                            dir="ltr"
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-[42px] w-[42px] shrink-0 text-destructive hover:text-destructive"
                                        onClick={() => removeService(idx)}
                                    >
                                        <Minus className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addService}>
                                <Plus className="h-3.5 w-3.5" />
                                إضافة خدمة صيانة
                            </Button>
                            {services.length > 0 && (
                                <div className="flex justify-end text-sm font-semibold text-muted-foreground">
                                    إجمالي الخدمات: <span className="ms-2 font-bold text-foreground">{totalServices.toFixed(2)}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Parts */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                القطع والمستلزمات
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {parts.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-2">لا توجد قطع بعد</p>
                            )}
                            {parts.map((part, idx) => (
                                <div key={idx} className="rounded-lg border p-3 space-y-2">
                                    <div className="flex gap-2 items-start">
                                        <div className="flex-1">
                                            <Input
                                                placeholder="اسم القطعة / المستلزم..."
                                                value={part.description}
                                                onChange={(e) => updatePart(idx, 'description', e.target.value)}
                                                className="min-h-[42px]"
                                            />
                                            {errors[`parts.${idx}.description`] && (
                                                <p className="text-xs text-destructive mt-1">{errors[`parts.${idx}.description`]}</p>
                                            )}
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-[42px] w-[42px] shrink-0 text-destructive hover:text-destructive"
                                            onClick={() => removePart(idx)}
                                        >
                                            <Minus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <Label className="text-xs text-muted-foreground mb-1 block">الكمية</Label>
                                            <Input
                                                type="number"
                                                min="0.001"
                                                step="0.001"
                                                value={part.quantity}
                                                onChange={(e) => updatePart(idx, 'quantity', e.target.value)}
                                                className="min-h-[38px]"
                                                dir="ltr"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground mb-1 block">سعر الوحدة</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={part.unit_price}
                                                onChange={(e) => updatePart(idx, 'unit_price', e.target.value)}
                                                className="min-h-[38px]"
                                                dir="ltr"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground mb-1 block">الإجمالي</Label>
                                            <Input
                                                readOnly
                                                value={partTotal(part)}
                                                className="min-h-[38px] bg-muted/50 font-semibold"
                                                dir="ltr"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addPart}>
                                <Plus className="h-3.5 w-3.5" />
                                إضافة قطعة
                            </Button>
                            {parts.length > 0 && (
                                <div className="flex justify-end text-sm font-semibold text-muted-foreground">
                                    إجمالي القطع: <span className="ms-2 font-bold text-foreground">{totalParts.toFixed(2)}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Notes */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">ملاحظات</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                className="min-h-[100px] resize-none"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="أي ملاحظات تخص هذا العرض..."
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* ── Right sidebar ── */}
                <div className="space-y-5">

                    {/* Valid days */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">صلاحية العرض</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Label htmlFor="valid_days" className="text-sm text-muted-foreground">عدد الأيام</Label>
                            <Input
                                id="valid_days"
                                type="number"
                                min="1"
                                max="365"
                                value={valid_days}
                                onChange={(e) => setValidDays(parseInt(e.target.value) || 15)}
                                className="min-h-[42px]"
                                dir="ltr"
                            />
                            {errors.valid_days && <p className="text-sm text-destructive">{errors.valid_days}</p>}
                        </CardContent>
                    </Card>

                    {/* Summary */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">ملخص المبالغ</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">إجمالي الخدمات</span>
                                <span className="font-semibold">{totalServices.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">إجمالي القطع</span>
                                <span className="font-semibold">{totalParts.toFixed(2)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between text-base font-bold">
                                <span>الإجمالي الكلي</span>
                                <span className="text-primary">{grandTotal.toFixed(2)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="space-y-2.5">
                        <Button
                            type="button"
                            size="lg"
                            variant="outline"
                            className="w-full gap-2"
                            disabled={processing}
                            onClick={(e) => submit(e as any, 'draft')}
                        >
                            {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            حفظ كمسودة
                        </Button>
                        <Button
                            type="button"
                            size="lg"
                            className="w-full gap-2"
                            disabled={processing}
                            onClick={(e) => submit(e as any, 'sent')}
                        >
                            {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            حفظ وإرسال
                        </Button>
                        <Link href="/quotations">
                            <Button type="button" variant="ghost" size="lg" className="w-full">
                                إلغاء
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </form>
    );
}
