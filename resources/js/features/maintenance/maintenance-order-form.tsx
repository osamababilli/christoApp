import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useForm } from '@inertiajs/react';
import { AlertTriangle, Calendar, Loader2, Save, X } from 'lucide-react';

interface Props {
    motorId: number;
    onCancel?: () => void;
}

const statusOptions = [
    { value: 'in_progress', label: 'قيد التنفيذ', color: 'border-yellow-300 bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:border-yellow-700 dark:text-yellow-300', active: 'ring-2 ring-yellow-400' },
    { value: 'completed',   label: 'مكتمل',       color: 'border-green-300 bg-green-50 text-green-700 dark:bg-green-950/40 dark:border-green-700 dark:text-green-300',     active: 'ring-2 ring-green-400'  },
    { value: 'on_hold',     label: 'موقوف',        color: 'border-red-300 bg-red-50 text-red-700 dark:bg-red-950/40 dark:border-red-700 dark:text-red-300',                 active: 'ring-2 ring-red-400'    },
];

export function MaintenanceOrderForm({ motorId, onCancel }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        motor_id:    motorId,
        description: '',
        status:      'in_progress',
        stop_reason: '',
        started_at:  new Date().toISOString().slice(0, 10),
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/maintenance', {
            preserveScroll: true,
            onSuccess: () => { reset(); onCancel?.(); },
        });
    }

    return (
        <form onSubmit={submit} className="space-y-5">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">إضافة أمر صيانة جديد</h3>
                {onCancel && (
                    <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                )}
            </div>

            <Separator />

            {/* Description */}
            <div className="space-y-2">
                <Label htmlFor="mo-description" className="font-medium">
                    وصف العمل <span className="text-destructive">*</span>
                </Label>
                <Textarea
                    id="mo-description"
                    className="min-h-[90px] resize-none"
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    placeholder="وصف تفصيلي لعمل الصيانة المطلوب..."
                    autoFocus
                />
                {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
            </div>

            {/* Status — visual chips */}
            <div className="space-y-2">
                <Label className="font-medium">حالة الأمر</Label>
                <div className="flex flex-wrap gap-2">
                    {statusOptions.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => setData('status', opt.value)}
                            className={cn(
                                'rounded-lg border px-4 py-2 text-sm font-semibold transition-all cursor-pointer',
                                opt.color,
                                data.status === opt.value && opt.active,
                            )}
                        >
                            {data.status === opt.value && <span className="me-1.5">✓</span>}
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stop reason — shown only for on_hold */}
            {data.status === 'on_hold' && (
                <div className="space-y-2 rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-900 dark:bg-orange-950/20">
                    <Label htmlFor="mo-stop-reason" className="flex items-center gap-1.5 font-medium text-orange-700 dark:text-orange-400">
                        <AlertTriangle className="h-4 w-4" />
                        سبب التوقف
                    </Label>
                    <Input
                        id="mo-stop-reason"
                        className="min-h-[40px] bg-white dark:bg-background"
                        value={data.stop_reason}
                        onChange={(e) => setData('stop_reason', e.target.value)}
                        placeholder="مثال: انتظار قطع الغيار"
                    />
                </div>
            )}

            {/* Start date */}
            <div className="space-y-2">
                <Label htmlFor="mo-started" className="flex items-center gap-1.5 font-medium">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    تاريخ البدء
                </Label>
                <Input
                    id="mo-started"
                    type="date"
                    className="min-h-[44px]"
                    dir="ltr"
                    value={data.started_at}
                    onChange={(e) => setData('started_at', e.target.value)}
                />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
                <Button type="submit" className="gap-2 min-h-11 flex-1" disabled={processing}>
                    {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {processing ? 'جاري الحفظ...' : 'حفظ الأمر'}
                </Button>
                {onCancel && (
                    <Button type="button" variant="outline" className="min-h-11 px-6" onClick={onCancel}>
                        إلغاء
                    </Button>
                )}
            </div>
        </form>
    );
}
