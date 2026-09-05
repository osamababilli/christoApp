import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from '@inertiajs/react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const formSchema = z.object({
    email: z.email({
        error: (iss) => (iss.input === '' ? 'يرجى إدخال البريد الإلكتروني' : 'البريد الإلكتروني غير صالح'),
    }),
});

export function ForgotPasswordForm({ className, ...props }: React.HTMLAttributes<HTMLFormElement>) {
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { email: '' },
    });

    function onSubmit(data: z.infer<typeof formSchema>) {
        setIsLoading(true);
        router.post('/forgot-password', data, {
            onFinish: () => setIsLoading(false),
            onSuccess: () => {
                form.reset();
                toast.success(`تم إرسال رابط إعادة التعيين إلى ${data.email}`);
            },
            onError: (errors) => {
                if (errors.email) form.setError('email', { message: errors.email });
            },
        });
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className={cn('grid gap-2', className)} {...props}>
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>البريد الإلكتروني</FormLabel>
                            <FormControl>
                                <Input placeholder="example@domain.com" dir="ltr" className="text-left placeholder:text-right" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button className="mt-2 gap-2" disabled={isLoading}>
                    إرسال الرابط
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowLeft className="h-4 w-4" />}
                </Button>
            </form>
        </Form>
    );
}
