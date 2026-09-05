import { ResetPassword } from '@/features/auth/reset-password';

export default function ResetPasswordPage(props: { token: string; email: string }) {
    return <ResetPassword {...props} />;
}
