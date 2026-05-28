import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthLayout } from '../auth-layout';
import { UserAuthForm } from './components/user-auth-form';

export function SignIn() {
    const searchParams = new URLSearchParams(window.location.search);
    const redirect = searchParams.get('redirect') || undefined;

    return (
        <AuthLayout>
            <Card className="gap-4">
                <CardHeader>
                    <CardTitle className="text-lg">تسجيل الدخول</CardTitle>
                    <CardDescription>أدخل بريدك الإلكتروني وكلمة المرور للوصول إلى حسابك</CardDescription>
                </CardHeader>
                <CardContent>
                    <UserAuthForm redirectTo={redirect} />
                </CardContent>
            </Card>
        </AuthLayout>
    );
}
