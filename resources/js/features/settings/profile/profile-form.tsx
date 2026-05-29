import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import type { SharedData } from '@/types';
import { useForm, usePage } from '@inertiajs/react';
import { Loader2, Save } from 'lucide-react';

export function ProfileForm() {
    const { auth } = usePage<SharedData>().props;
    const user = auth?.user;

    const { data, setData, put, processing, errors, reset } = useForm({
        name: user?.name ?? '',
        email: user?.email ?? '',
        phone: (user?.phone as string) ?? '',
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put('/settings/profile', {
            preserveScroll: true,
            onSuccess: () => reset('current_password', 'password', 'password_confirmation'),
        });
    }

    return (
        <form onSubmit={submit} className="space-y-6 max-w-lg">
            {/* Personal info */}
            <div className="space-y-4">
                <div className="space-y-1.5">
                    <Label htmlFor="prof-name">
                        الاسم <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="prof-name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        placeholder="الاسم الكامل"
                    />
                    {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="prof-email">
                        البريد الإلكتروني <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="prof-email"
                        type="email"
                        dir="ltr"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        placeholder="email@example.com"
                    />
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="prof-phone">رقم الجوال</Label>
                    <Input
                        id="prof-phone"
                        dir="ltr"
                        value={data.phone}
                        onChange={(e) => setData('phone', e.target.value)}
                        placeholder="05xxxxxxxx"
                    />
                    {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                </div>
            </div>

            <Separator />

            {/* Password change */}
            <div className="space-y-4">
                <div>
                    <h3 className="text-sm font-semibold">تغيير كلمة المرور</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">اتركها فارغة إذا لم ترغب بتغيير كلمة المرور.</p>
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="prof-current-pw">كلمة المرور الحالية</Label>
                    <Input
                        id="prof-current-pw"
                        type="password"
                        value={data.current_password}
                        onChange={(e) => setData('current_password', e.target.value)}
                        autoComplete="current-password"
                    />
                    {errors.current_password && <p className="text-xs text-destructive">{errors.current_password}</p>}
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="prof-new-pw">كلمة المرور الجديدة</Label>
                    <Input
                        id="prof-new-pw"
                        type="password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        autoComplete="new-password"
                    />
                    {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="prof-confirm-pw">تأكيد كلمة المرور الجديدة</Label>
                    <Input
                        id="prof-confirm-pw"
                        type="password"
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        autoComplete="new-password"
                    />
                </div>
            </div>

            <Button type="submit" disabled={processing} className="gap-2">
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {processing ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </Button>
        </form>
    );
}
