import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useCan } from '@/hooks/use-can';
import { cn } from '@/lib/utils';
import { Link, router, useForm } from '@inertiajs/react';
import {
    ArrowRight,
    Calendar,
    CheckCircle2,
    Clock,
    ExternalLink,
    FileText,
    Pencil,
    Phone,
    Plus,
    Printer,
    RefreshCw,
    Send,
    Trash2,
    User,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';

interface ServiceItem {
    id: number;
    description: string;
    labor_cost: number;
}

interface PartItem {
    id: number;
    description: string;
    part_type: string | null;
    part_type_label: string;
    quantity: number;
    unit_price: number;
    total_price: number;
}

interface Quotation {
    id: number;
    reference_number: string;
    customer_id: number | null;
    customer_name: string;
    customer_phone: string;
    status: string;
    status_label: string;
    notes: string | null;
    valid_days: number;
    created_at: string;
    converted_to_motor_id: number | null;
    converted_motor_ref: string | null;
    services: ServiceItem[];
    parts: PartItem[];
    total_services: number;
    total_parts: number;
    grand_total: number;
}

interface EmployeeOption {
    id: number;
    full_name: string;
}

interface Props {
    quotation: Quotation;
    employees: EmployeeOption[];
}

const statusConfig: Record<string, { label: string; color: string }> = {
    draft: { label: 'مسودة', color: 'bg-gray-100 text-gray-700 border-gray-200' },
    sent: { label: 'تم الإرسال', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    accepted: { label: 'مقبول', color: 'bg-green-100 text-green-800 border-green-200' },
    rejected: { label: 'مرفوض', color: 'bg-red-100 text-red-800 border-red-200' },
    converted: { label: 'تم التحويل', color: 'bg-purple-100 text-purple-800 border-purple-200' },
};

export function QuotationShow({ quotation, employees }: Props) {
    const can = useCan();
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [convertOpen, setConvertOpen] = useState(false);

    const convertForm = useForm({
        notes: quotation.notes ?? '',
        received_by: null as number | null,
        received_items: [{ item_name: '', quantity: '1' }] as { item_name: string; quantity: string }[],
    });

    function addConvertItem() {
        convertForm.setData('received_items', [...convertForm.data.received_items, { item_name: '', quantity: '1' }]);
    }

    function removeConvertItem(idx: number) {
        convertForm.setData(
            'received_items',
            convertForm.data.received_items.filter((_, i) => i !== idx),
        );
    }

    function updateConvertItem(idx: number, field: 'item_name' | 'quantity', value: string) {
        convertForm.setData(
            'received_items',
            convertForm.data.received_items.map((row, i) => (i === idx ? { ...row, [field]: value } : row)),
        );
    }

    function updateStatus(status: string) {
        router.patch(`/quotations/${quotation.id}/status`, { status }, { preserveScroll: true });
    }

    function doDelete() {
        router.delete(`/quotations/${quotation.id}`);
    }

    function submitConvert(e: React.FormEvent) {
        e.preventDefault();
        convertForm.transform((data) => ({
            ...data,
            received_items: data.received_items.filter((r) => r.item_name.trim() !== ''),
        }));
        convertForm.post(`/quotations/${quotation.id}/convert`);
    }

    const cfg = statusConfig[quotation.status] ?? { label: quotation.status_label, color: 'bg-gray-100 text-gray-700 border-gray-200' };

    return (
        <>
            <Header fixed>
                <div className="flex flex-1 items-center gap-3">
                    <Link href="/quotations">
                        <Button variant="ghost" size="sm" className="gap-1.5">
                            <ArrowRight className="h-4 w-4" />
                            عروض الأسعار
                        </Button>
                    </Link>
                    <span className="text-muted-foreground">/</span>
                    <span className="font-mono text-sm font-semibold">{quotation.reference_number}</span>
                </div>
                <div className="ms-auto flex items-center gap-3">
                    <ThemeSwitch />
                    <ProfileDropdown />
                </div>
            </Header>

            <Main className="flex flex-1 flex-col gap-5">
                {/* ── Page header ── */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-2xl font-bold tracking-tight">عرض سعر</h2>
                            <span className="font-mono text-lg font-semibold text-muted-foreground">{quotation.reference_number}</span>
                            <Badge variant="outline" className={cn('text-sm', cfg.color)}>
                                {cfg.label}
                            </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5" />
                                {quotation.customer_name}
                            </span>
                            <span className="flex items-center gap-1.5" dir="ltr">
                                <Phone className="h-3.5 w-3.5" />
                                {quotation.customer_phone}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                {quotation.created_at}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" />
                                صالح {quotation.valid_days} يوماً
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/quotations/${quotation.id}/print`} target="_blank">
                            <Button variant="outline" size="sm" className="gap-1.5">
                                <Printer className="h-4 w-4" />
                                طباعة
                            </Button>
                        </Link>
                        {quotation.status !== 'converted' && quotation.status !== 'rejected' && (
                            <Link href={`/quotations/${quotation.id}/edit`}>
                                <Button variant="outline" size="sm" className="gap-1.5">
                                    <Pencil className="h-4 w-4" />
                                    تعديل
                                </Button>
                            </Link>
                        )}
                        {quotation.status === 'accepted' &&
                            (can('convert-quotations') ? (
                                <Button
                                    size="sm"
                                    className="gap-1.5 bg-purple-600 text-white hover:bg-purple-700"
                                    onClick={() => setConvertOpen(true)}
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    تحويل إلى قيد استلام
                                </Button>
                            ) : null)}
                        {can('delete-quotations') && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1.5 text-destructive hover:text-destructive"
                                onClick={() => setDeleteOpen(true)}
                            >
                                <Trash2 className="h-4 w-4" />
                                حذف
                            </Button>
                        )}
                    </div>
                </div>

                {/* ── Status transitions ── */}
                {quotation.status !== 'converted' && quotation.status !== 'rejected' && (
                    <Card>
                        <CardContent className="flex flex-wrap items-center gap-3 py-3">
                            <span className="text-sm font-medium text-muted-foreground">تغيير الحالة:</span>
                            {quotation.status === 'draft' && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-50"
                                    onClick={() => updateStatus('sent')}
                                >
                                    <Send className="h-3.5 w-3.5" />
                                    إرسال للعميل
                                </Button>
                            )}
                            {quotation.status === 'sent' && (
                                <>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-1.5 border-green-300 text-green-700 hover:bg-green-50"
                                        onClick={() => updateStatus('accepted')}
                                    >
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        قبول العرض
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-1.5 border-red-300 text-red-700 hover:bg-red-50"
                                        onClick={() => updateStatus('rejected')}
                                    >
                                        <XCircle className="h-3.5 w-3.5" />
                                        رفض العرض
                                    </Button>
                                </>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* ── Converted motor link ── */}
                {quotation.status === 'converted' && quotation.converted_to_motor_id && (
                    <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950/20">
                        <CardContent className="flex flex-wrap items-center gap-3 py-3">
                            <RefreshCw className="h-4 w-4 text-purple-600" />
                            <span className="text-sm text-purple-700 dark:text-purple-400">تم تحويل هذا العرض إلى قيد استلام:</span>
                            <Link href={`/motors/${quotation.converted_to_motor_id}`}>
                                <Button variant="outline" size="sm" className="gap-1.5 border-purple-300 text-purple-700 hover:bg-purple-100">
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    {quotation.converted_motor_ref}
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}

                <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
                    <div className="space-y-5">
                        {/* Services table */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">خدمات الصيانة</CardTitle>
                            </CardHeader>
                            <CardContent className="overflow-x-auto p-0">
                                {quotation.services.length === 0 ? (
                                    <p className="py-6 text-center text-sm text-muted-foreground">لا توجد خدمات</p>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="text-right">#</TableHead>
                                                <TableHead className="text-right">الوصف</TableHead>
                                                <TableHead className="text-right">تكلفة العمالة</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {quotation.services.map((svc, i) => (
                                                <TableRow key={svc.id}>
                                                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                                                    <TableCell>{svc.description}</TableCell>
                                                    <TableCell className="font-semibold">{svc.labor_cost.toFixed(2)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>

                        {/* Parts table */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">القطع والمستلزمات</CardTitle>
                            </CardHeader>
                            <CardContent className="overflow-x-auto p-0">
                                {quotation.parts.length === 0 ? (
                                    <p className="py-6 text-center text-sm text-muted-foreground">لا توجد قطع</p>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="text-right">#</TableHead>
                                                <TableHead className="text-right">الاسم</TableHead>
                                                <TableHead className="text-right">النوع</TableHead>
                                                <TableHead className="text-right">الكمية</TableHead>
                                                <TableHead className="text-right">سعر الوحدة</TableHead>
                                                <TableHead className="text-right">الإجمالي</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {quotation.parts.map((part, i) => (
                                                <TableRow key={part.id}>
                                                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                                                    <TableCell className="font-medium">{part.description}</TableCell>
                                                    <TableCell>
                                                        {part.part_type_label ? (
                                                            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-xs text-blue-700">
                                                                {part.part_type_label}
                                                            </Badge>
                                                        ) : (
                                                            '—'
                                                        )}
                                                    </TableCell>
                                                    <TableCell>{part.quantity}</TableCell>
                                                    <TableCell>{part.unit_price.toFixed(2)}</TableCell>
                                                    <TableCell className="font-semibold">{part.total_price.toFixed(2)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>

                        {/* Notes */}
                        {quotation.notes && (
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        ملاحظات
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm leading-relaxed text-muted-foreground">{quotation.notes}</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* ── Right sidebar ── */}
                    <div className="space-y-5">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">ملخص المبالغ</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">إجمالي الخدمات</span>
                                    <span className="font-semibold">{quotation.total_services.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">إجمالي القطع</span>
                                    <span className="font-semibold">{quotation.total_parts.toFixed(2)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between text-base font-bold">
                                    <span>الإجمالي الكلي</span>
                                    <span className="text-primary">{quotation.grand_total.toFixed(2)}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </Main>

            {/* ── Delete dialog ── */}
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                        <AlertDialogDescription>
                            هل أنت متأكد من حذف عرض السعر <span className="font-bold">{quotation.reference_number}</span>؟ لا يمكن التراجع عن هذا
                            الإجراء.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction className="text-destructive-foreground bg-destructive hover:bg-destructive/90" onClick={doDelete}>
                            نعم، احذف
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ── Convert dialog ── */}
            <AlertDialog open={convertOpen} onOpenChange={setConvertOpen}>
                <AlertDialogContent className="max-h-[85vh] max-w-md overflow-y-auto">
                    <AlertDialogHeader>
                        <AlertDialogTitle>تحويل إلى قيد استلام</AlertDialogTitle>
                        <AlertDialogDescription>سيتم إنشاء قيد استلام جديد بناءً على هذا العرض وخدماته.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <form onSubmit={submitConvert} className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>موظف الاستلام (اختياري)</Label>
                            <Select
                                value={convertForm.data.received_by?.toString() ?? ''}
                                onValueChange={(v) => convertForm.setData('received_by', v ? parseInt(v) : null)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="غير محدد" />
                                </SelectTrigger>
                                <SelectContent>
                                    {employees.map((emp) => (
                                        <SelectItem key={emp.id} value={emp.id.toString()}>
                                            {emp.full_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>ماذا استلمنا؟ (اسم القطعة والعدد)</Label>
                            {convertForm.data.received_items.map((row, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <Input
                                        placeholder="مثال: موتور"
                                        value={row.item_name}
                                        onChange={(e) => updateConvertItem(idx, 'item_name', e.target.value)}
                                        className="flex-1"
                                    />
                                    <Input
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={row.quantity}
                                        onChange={(e) => updateConvertItem(idx, 'quantity', e.target.value)}
                                        className="w-20"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                                        onClick={() => removeConvertItem(idx)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addConvertItem}>
                                <Plus className="h-3.5 w-3.5" />
                                إضافة قطعة مستلمة
                            </Button>
                        </div>
                        <div className="space-y-2">
                            <Label>ملاحظات</Label>
                            <Textarea
                                value={convertForm.data.notes}
                                onChange={(e) => convertForm.setData('notes', e.target.value)}
                                className="min-h-[80px] resize-none"
                                placeholder="ملاحظات اختيارية..."
                            />
                        </div>
                        <AlertDialogFooter>
                            <AlertDialogCancel type="button">إلغاء</AlertDialogCancel>
                            <Button type="submit" disabled={convertForm.processing} className="gap-1.5">
                                {convertForm.processing ? 'جاري التحويل...' : 'تحويل'}
                            </Button>
                        </AlertDialogFooter>
                    </form>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
