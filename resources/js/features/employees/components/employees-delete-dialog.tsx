import { ConfirmDialog } from '@/components/confirm-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { router } from '@inertiajs/react';
import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { type Employee } from '../data/schema';

type EmployeesDeleteDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentRow: Employee;
};

export function EmployeesDeleteDialog({ open, onOpenChange, currentRow }: EmployeesDeleteDialogProps) {
    const [value, setValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const confirmed = value.trim() === currentRow.id_number;

    const handleDelete = () => {
        if (!confirmed) return;
        setIsLoading(true);
        router.delete(`/employees/${currentRow.id}`, {
            onSuccess: () => {
                setValue('');
                onOpenChange(false);
            },
            onFinish: () => setIsLoading(false),
        });
    };

    return (
        <ConfirmDialog
            open={open}
            onOpenChange={(state) => {
                setValue('');
                onOpenChange(state);
            }}
            handleConfirm={handleDelete}
            disabled={!confirmed || isLoading}
            title={
                <span className="text-destructive">
                    <AlertTriangle className="me-1 inline-block stroke-destructive" size={18} />
                    حذف موظف
                </span>
            }
            desc={
                <div className="space-y-4">
                    <p>
                        هل أنت متأكد من حذف{' '}
                        <span className="font-bold">{currentRow.full_name}</span>؟
                        <br />
                        لا يمكن التراجع عن هذا الإجراء.
                    </p>
                    <Label className="flex flex-col gap-1.5">
                        <span>أدخل رقم هوية الموظف للتأكيد:</span>
                        <Input
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder={currentRow.id_number}
                        />
                    </Label>
                    <Alert variant="destructive">
                        <AlertTitle>تحذير</AlertTitle>
                        <AlertDescription>سيتم حذف بيانات الموظف وصورة الهوية نهائياً.</AlertDescription>
                    </Alert>
                </div>
            }
            confirmText={isLoading ? 'جاري الحذف…' : 'حذف'}
            destructive
        />
    );
}
