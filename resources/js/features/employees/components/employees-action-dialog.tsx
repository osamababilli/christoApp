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
import { bloodTypes, nationalities } from '../data/data';
import { type Employee } from '../data/schema';

const formSchema = z.object({
    full_name: z.string().min(1, 'الاسم الكامل مطلوب.'),
    id_number: z.string().min(1, 'رقم الهوية مطلوب.'),
    nationality: z.string().min(1, 'الجنسية مطلوبة.'),
    blood_type: z.string().min(1, 'زمرة الدم مطلوبة.'),
    emergency_phone: z.string().min(1, 'رقم الطوارئ مطلوب.'),
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
                  nationality: currentRow.nationality,
                  blood_type: currentRow.blood_type,
                  emergency_phone: currentRow.emergency_phone,
              }
            : { full_name: '', id_number: '', nationality: '', blood_type: '', emergency_phone: '' },
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
        formData.append('nationality', values.nationality);
        formData.append('blood_type', values.blood_type);
        formData.append('emergency_phone', values.emergency_phone);
        if (imageFile) {
            formData.append('id_image', imageFile);
        }

        if (isEdit) {
            formData.append('_method', 'POST');
            router.post(`/employees/${currentRow!.id}`, formData, {
                forceFormData: true,
                onSuccess: () => { form.reset(); setImageFile(null); onOpenChange(false); },
                onError: (errors) => {
                    Object.entries(errors).forEach(([key, msg]) => form.setError(key as any, { message: msg }));
                },
                onFinish: () => setIsLoading(false),
            });
        } else {
            router.post('/employees', formData, {
                forceFormData: true,
                onSuccess: () => { form.reset(); setImageFile(null); setImagePreview(null); onOpenChange(false); },
                onError: (errors) => {
                    Object.entries(errors).forEach(([key, msg]) => form.setError(key as any, { message: msg }));
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
            <DialogContent className="sm:max-w-lg">
                <DialogHeader className="text-start">
                    <DialogTitle>{isEdit ? 'تعديل بيانات موظف' : 'إضافة موظف جديد'}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? 'تحديث بيانات الموظف.' : 'إنشاء سجل موظف جديد.'} انقر حفظ عند الانتهاء.
                    </DialogDescription>
                </DialogHeader>

                <div className="max-h-[30rem] overflow-y-auto py-1 pe-1">
                    <Form {...form}>
                        <form id="employee-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-0.5">
                            <FormField
                                control={form.control}
                                name="full_name"
                                render={({ field }) => (
                                    <FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
                                        <FormLabel className="col-span-2 text-end">الاسم الكامل</FormLabel>
                                        <FormControl>
                                            <Input placeholder="محمد أحمد علي" className="col-span-4" autoComplete="off" {...field} />
                                        </FormControl>
                                        <FormMessage className="col-span-4 col-start-3" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="id_number"
                                render={({ field }) => (
                                    <FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
                                        <FormLabel className="col-span-2 text-end">رقم الهوية</FormLabel>
                                        <FormControl>
                                            <Input placeholder="1234567890" className="col-span-4" autoComplete="off" {...field} />
                                        </FormControl>
                                        <FormMessage className="col-span-4 col-start-3" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="nationality"
                                render={({ field }) => (
                                    <FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
                                        <FormLabel className="col-span-2 text-end">الجنسية</FormLabel>
                                        <SelectDropdown
                                            defaultValue={field.value}
                                            onValueChange={field.onChange}
                                            placeholder="اختر الجنسية"
                                            className="col-span-4"
                                            items={nationalities.map(({ label, value }) => ({ label, value }))}
                                        />
                                        <FormMessage className="col-span-4 col-start-3" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="blood_type"
                                render={({ field }) => (
                                    <FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
                                        <FormLabel className="col-span-2 text-end">زمرة الدم</FormLabel>
                                        <SelectDropdown
                                            defaultValue={field.value}
                                            onValueChange={field.onChange}
                                            placeholder="اختر زمرة الدم"
                                            className="col-span-4"
                                            items={bloodTypes.map(({ label, value }) => ({ label, value }))}
                                        />
                                        <FormMessage className="col-span-4 col-start-3" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="emergency_phone"
                                render={({ field }) => (
                                    <FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
                                        <FormLabel className="col-span-2 text-end">رقم الطوارئ</FormLabel>
                                        <FormControl>
                                            <Input placeholder="+966501234567" className="col-span-4" {...field} />
                                        </FormControl>
                                        <FormMessage className="col-span-4 col-start-3" />
                                    </FormItem>
                                )}
                            />

                            {/* صورة الهوية */}
                            <div className="grid grid-cols-6 items-start gap-x-4 gap-y-1">
                                <span className="col-span-2 pt-2 text-end text-sm font-medium">صورة الهوية</span>
                                <div className="col-span-4 flex flex-col gap-2">
                                    {imagePreview ? (
                                        <div className="relative w-fit">
                                            <img
                                                src={imagePreview}
                                                alt="معاينة صورة الهوية"
                                                className="h-28 w-44 rounded-md border object-cover"
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
                                            className="flex h-28 w-44 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/60"
                                        >
                                            <ImageIcon size={28} />
                                            <span className="text-xs">انقر لرفع صورة</span>
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
                                            className="w-fit text-xs"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            تغيير الصورة
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </form>
                    </Form>
                </div>

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
