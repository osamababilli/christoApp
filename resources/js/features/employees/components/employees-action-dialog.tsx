import { SelectDropdown } from '@/components/select-dropdown';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from '@inertiajs/react';
import { ImageIcon, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { bloodTypes, documentTypes, nationalities, salaryPeriods } from '../data/data';
import { type Employee } from '../data/schema';

const formSchema = z
    .object({
        full_name: z.string().min(1, 'الاسم الكامل مطلوب.'),
        id_number: z.string().min(1, 'رقم الهوية مطلوب.'),
        document_type: z.string().min(1, 'نوع الوثيقة مطلوب.'),
        nationality: z.string().min(1, 'الجنسية مطلوبة.'),
        blood_type: z.string().min(1, 'زمرة الدم مطلوبة.'),
        emergency_phone: z.string().min(1, 'رقم الطوارئ مطلوب.'),
        emergency_contact_name: z.string().min(1, 'اسم جهة الاتصال في الطوارئ مطلوب.'),
        emergency_contact_relationship: z.string().min(1, 'صلة القرابة مطلوبة.'),
        salary_amount: z.string().optional(),
        salary_period: z.string().optional(),
    })
    .refine((data) => !data.salary_amount || !!data.salary_period, {
        message: 'اختر دورية الراتب.',
        path: ['salary_period'],
    });

type EmployeeForm = z.infer<typeof formSchema>;

type EmployeesActionDialogProps = {
    currentRow?: Employee;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export function EmployeesActionDialog({ currentRow, open, onOpenChange }: EmployeesActionDialogProps) {
    const isEdit = !!currentRow;
    const [isLoading, setIsLoading] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(currentRow?.id_image ?? null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<EmployeeForm>({
        resolver: zodResolver(formSchema),
        defaultValues: isEdit
            ? {
                  full_name: currentRow.full_name,
                  id_number: currentRow.id_number,
                  document_type: currentRow.document_type ?? '',
                  nationality: currentRow.nationality,
                  blood_type: currentRow.blood_type,
                  emergency_phone: currentRow.emergency_phone,
                  emergency_contact_name: currentRow.emergency_contact_name ?? '',
                  emergency_contact_relationship: currentRow.emergency_contact_relationship ?? '',
                  salary_amount: currentRow.salary_amount != null ? String(currentRow.salary_amount) : '',
                  salary_period: currentRow.salary_period ?? '',
              }
            : {
                  full_name: '',
                  id_number: '',
                  document_type: '',
                  nationality: '',
                  blood_type: '',
                  emergency_phone: '',
                  emergency_contact_name: '',
                  emergency_contact_relationship: '',
                  salary_amount: '',
                  salary_period: '',
              },
    });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const clearImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const onSubmit = (values: EmployeeForm) => {
        setIsLoading(true);

        const formData = new FormData();
        formData.append('full_name', values.full_name);
        formData.append('id_number', values.id_number);
        formData.append('document_type', values.document_type);
        formData.append('nationality', values.nationality);
        formData.append('blood_type', values.blood_type);
        formData.append('emergency_phone', values.emergency_phone);
        formData.append('emergency_contact_name', values.emergency_contact_name);
        formData.append('emergency_contact_relationship', values.emergency_contact_relationship);
        if (values.salary_amount) {
            formData.append('salary_amount', values.salary_amount);
            formData.append('salary_period', values.salary_period ?? '');
        }
        if (imageFile) {
            formData.append('id_image', imageFile);
        }

        if (isEdit) {
            formData.append('_method', 'POST');
            router.post(`/employees/${currentRow!.id}`, formData, {
                forceFormData: true,
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => { form.reset(); setImageFile(null); onOpenChange(false); },
                onError: (errors) => {
                    Object.entries(errors).forEach(([key, msg]) => form.setError(key as Parameters<typeof form.setError>[0], { message: msg }));
                },
                onFinish: () => setIsLoading(false),
            });
        } else {
            router.post('/employees', formData, {
                forceFormData: true,
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => { form.reset(); setImageFile(null); setImagePreview(null); onOpenChange(false); },
                onError: (errors) => {
                    Object.entries(errors).forEach(([key, msg]) => form.setError(key as Parameters<typeof form.setError>[0], { message: msg }));
                },
                onFinish: () => setIsLoading(false),
            });
        }
    };

    const handleClose = (state: boolean) => {
        form.reset();
        setImageFile(null);
        setImagePreview(currentRow?.id_image ?? null);
        onOpenChange(state);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-h-[95vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader className="text-start">
                    <DialogTitle>{isEdit ? 'تعديل بيانات موظف' : 'إضافة موظف جديد'}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? 'تحديث بيانات الموظف.' : 'إنشاء سجل موظف جديد.'} انقر حفظ عند الانتهاء.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        id="employee-form"
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2"
                    >
                        <FormField
                            control={form.control}
                            name="full_name"
                            render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                    <FormLabel>الاسم الكامل</FormLabel>
                                    <FormControl>
                                        <Input placeholder="محمد أحمد علي" autoComplete="off" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="id_number"
                            render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                    <FormLabel>رقم الهوية</FormLabel>
                                    <FormControl>
                                        <Input placeholder="1234567890" autoComplete="off" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="document_type"
                            render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                    <FormLabel>نوع الوثيقة</FormLabel>
                                    <SelectDropdown
                                        defaultValue={field.value}
                                        onValueChange={field.onChange}
                                        placeholder="اختر نوع الوثيقة"
                                        className="w-full"
                                        items={documentTypes.map(({ label, value }) => ({ label, value }))}
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="nationality"
                            render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                    <FormLabel>الجنسية</FormLabel>
                                    <SelectDropdown
                                        defaultValue={field.value}
                                        onValueChange={field.onChange}
                                        placeholder="اختر الجنسية"
                                        className="w-full"
                                        items={nationalities.map(({ label, value }) => ({ label, value }))}
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="blood_type"
                            render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                    <FormLabel>زمرة الدم</FormLabel>
                                    <SelectDropdown
                                        defaultValue={field.value}
                                        onValueChange={field.onChange}
                                        placeholder="اختر زمرة الدم"
                                        className="w-full"
                                        items={bloodTypes.map(({ label, value }) => ({ label, value }))}
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="emergency_phone"
                            render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                    <FormLabel>رقم الطوارئ</FormLabel>
                                    <FormControl>
                                        <Input placeholder="+966501234567" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="emergency_contact_name"
                            render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                    <FormLabel>اسم جهة اتصال الطوارئ</FormLabel>
                                    <FormControl>
                                        <Input placeholder="اسم الشخص المطلوب الاتصال به" autoComplete="off" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="emergency_contact_relationship"
                            render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                    <FormLabel>صلة القرابة</FormLabel>
                                    <FormControl>
                                        <Input placeholder="مثال: أخ، زوجة، والد" autoComplete="off" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="salary_amount"
                            render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                    <FormLabel>الراتب</FormLabel>
                                    <FormControl>
                                        <Input type="number" min="0" step="0.01" placeholder="0.00" autoComplete="off" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="salary_period"
                            render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                    <FormLabel>دورية الراتب</FormLabel>
                                    <SelectDropdown
                                        defaultValue={field.value}
                                        onValueChange={field.onChange}
                                        placeholder="اختر الدورية"
                                        className="w-full"
                                        items={salaryPeriods.map(({ label, value }) => ({ label, value }))}
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* صورة الهوية */}
                        <div className="flex items-center gap-3 sm:col-span-2">
                            <span className="shrink-0 text-sm font-medium">صورة الهوية</span>
                            {imagePreview ? (
                                <div className="relative w-fit">
                                    <img
                                        src={imagePreview}
                                        alt="معاينة صورة الهوية"
                                        className="h-16 w-24 rounded-md border object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={clearImage}
                                        className="absolute -right-2 -top-2 rounded-full bg-destructive p-0.5 text-destructive-foreground"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex h-16 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/60"
                                >
                                    <ImageIcon size={20} />
                                    <span className="text-[10px]">انقر لرفع صورة</span>
                                </div>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageChange}
                            />
                            {imagePreview && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    تغيير الصورة
                                </Button>
                            )}
                        </div>
                    </form>
                </Form>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        إلغاء
                    </Button>
                    <Button type="submit" form="employee-form" disabled={isLoading}>
                        {isLoading ? 'جاري الحفظ…' : 'حفظ'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
