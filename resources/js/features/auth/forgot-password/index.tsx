import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@inertiajs/react';
import { AuthLayout } from '../auth-layout';
import { ForgotPasswordForm } from './components/forgot-password-form';

export function ForgotPassword() {
    return (
        <AuthLayout>
            <Card className="gap-4">
                <CardHeader>
                    <CardTitle className="text-lg tracking-tight">استعادة كلمة المرور</CardTitle>
                    <CardDescription>أدخل بريدك الإلكتروني المسجَّل وسنرسل لك رابطاً لتعيين كلمة مرور جديدة.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ForgotPasswordForm />
                </CardContent>
                <CardFooter>
                    <p className="mx-auto px-8 text-center text-sm text-balance text-muted-foreground">
                        <Link href="/sign-in" className="underline underline-offset-4 hover:text-primary">
                            العودة لتسجيل الدخول
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </AuthLayout>
    );
}
