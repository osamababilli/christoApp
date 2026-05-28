import { PasswordInput } from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from '@inertiajs/react';
import { Loader2, LogIn } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const formSchema = z.object({
    email: z.email({
        error: (iss) => (iss.input === '' ? 'يرجى إدخال البريد الإلكتروني' : undefined),
    }),
    password: z
        .string()
        .min(1, 'يرجى إدخال كلمة المرور')
        .min(7, 'كلمة المرور يجب أن تكون 7 أحرف على الأقل'),
});

interface UserAuthFormProps extends React.HTMLAttributes<HTMLFormElement> {
    redirectTo?: string;
}

export function UserAuthForm({ className, redirectTo, ...props }: UserAuthFormProps) {
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { email: '', password: '' },
    });

    function onSubmit(data: z.infer<typeof formSchema>) {
        setIsLoading(true);
        router.post('/login', data, {
            onFinish: () => setIsLoading(false),
            onError: (errors) => {
                if (errors.email) form.setError('email', { message: errors.email });
                if (errors.password) form.setError('password', { message: errors.password });
            },
        });
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className={cn('grid gap-4', className)} {...props}>
                {/* Email */}
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>البريد الإلكتروني</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="example@domain.com"
                                    dir="ltr"
                                    className="text-left placeholder:text-right"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Password */}
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem className="relative">
                            <div className="flex items-center justify-between">
                                <FormLabel>كلمة المرور</FormLabel>
                                <a
                                    href="/forgot-password"
                                    className="text-sm font-medium text-muted-foreground hover:opacity-75"
                                >
                                    نسيت كلمة المرور؟
                                </a>
                            </div>
                            <FormControl>
                                <PasswordInput
                                    placeholder="••••••••"
                                    dir="ltr"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Submit */}
                <Button className="mt-1 w-full gap-2" disabled={isLoading}>
                    دخول
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                </Button>
            </form>
        </Form>
    );
}
