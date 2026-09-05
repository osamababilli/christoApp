import { PasswordInput } from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link, useForm } from '@inertiajs/react';
import { KeyRound, Loader2 } from 'lucide-react';
import { AuthLayout } from '../auth-layout';

interface Props {
    token: string;
    email: string;
}

export function ResetPassword({ token, email }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        token,
        email,
        password: '',
        password_confirmation: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/reset-password');
    }

    return (
        <AuthLayout>
            <Card className="gap-4">
                <CardHeader>
                    <CardTitle className="text-lg">تعيين كلمة مرور جديدة</CardTitle>
                    <CardDescription>اختر كلمة مرور قوية — 8 أحرف على الأقل، ويُفضَّل أن تحوي أرقاماً وحروفاً كبيرة وصغيرة</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={submit} className="grid gap-4">
                        <div className="grid gap-1.5">
                            <Label htmlFor="rp-email">البريد الإلكتروني</Label>
                            <Input
                                id="rp-email"
                                type="email"
                                dir="ltr"
                                autoComplete="username"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                            />
                            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="rp-password">كلمة المرور الجديدة</Label>
                            <PasswordInput
                                id="rp-password"
                                dir="ltr"
                                autoComplete="new-password"
                                placeholder="••••••••"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                            />
                            {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="rp-password-confirm">تأكيد كلمة المرور</Label>
                            <PasswordInput
                                id="rp-password-confirm"
                                dir="ltr"
                                autoComplete="new-password"
                                placeholder="••••••••"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                            />
                        </div>
                        <Button className="mt-1 w-full gap-2" disabled={processing}>
                            حفظ كلمة المرور
                            {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter>
                    <p className="mx-auto text-center text-sm text-muted-foreground">
                        <Link href="/sign-in" className="underline underline-offset-4 hover:text-primary">العودة لتسجيل الدخول</Link>
                    </p>
                </CardFooter>
            </Card>
        </AuthLayout>
    );
}
