import { PasswordInput } from '@/components/password-input';
import { SelectDropdown } from '@/components/select-dropdown';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { roles, statuses } from '../data/data';
import { type User } from '../data/schema';

const formSchema = z
    .object({
        name: z.string().min(1, 'Name is required.'),
        email: z.email({ error: (i) => (i.input === '' ? 'Email is required.' : undefined) }),
        phone: z.string().optional(),
        role: z.string().min(1, 'Role is required.'),
        status: z.string().min(1, 'Status is required.'),
        password: z.string().transform((v) => v.trim()),
        confirmPassword: z.string().transform((v) => v.trim()),
        isEdit: z.boolean(),
    })
    .refine((d) => d.isEdit || d.password.length > 0, {
        message: 'Password is required.',
        path: ['password'],
    })
    .refine((d) => (d.isEdit && !d.password) || d.password.length >= 8, {
        message: 'Password must be at least 8 characters.',
        path: ['password'],
    })
    .refine((d) => (d.isEdit && !d.password) || d.password === d.confirmPassword, {
        message: "Passwords don't match.",
        path: ['confirmPassword'],
    });

type UserForm = z.infer<typeof formSchema>;

type UsersActionDialogProps = {
    currentRow?: User;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export function UsersActionDialog({ currentRow, open, onOpenChange }: UsersActionDialogProps) {
    const isEdit = !!currentRow;
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<UserForm>({
        resolver: zodResolver(formSchema),
        defaultValues: isEdit
            ? { ...currentRow, password: '', confirmPassword: '', phone: currentRow.phone ?? '', isEdit: true }
            : { name: '', email: '', phone: '', role: '', status: 'active', password: '', confirmPassword: '', isEdit: false },
    });

    const isPasswordTouched = !!form.formState.dirtyFields.password;

    const onSubmit = (values: UserForm) => {
        setIsLoading(true);
        const payload = {
            name: values.name,
            email: values.email,
            phone: values.phone || null,
            role: values.role,
            status: values.status,
            ...(values.password ? { password: values.password, password_confirmation: values.confirmPassword } : {}),
        };

        const url = isEdit ? `/settings/users/${currentRow!.id}` : '/settings/users';
        const method = isEdit ? router.put : router.post;

        method(url, payload, {
            onSuccess: () => {
                form.reset();
                onOpenChange(false);
            },
            onError: (errors) => {
                Object.entries(errors).forEach(([key, msg]) => {
                    form.setError(key as Parameters<typeof form.setError>[0], { message: msg });
                });
            },
            onFinish: () => setIsLoading(false),
        });
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(state) => {
                form.reset();
                onOpenChange(state);
            }}
        >
            <DialogContent className="sm:max-w-lg">
                <DialogHeader className="text-start">
                    <DialogTitle>{isEdit ? 'Edit User' : 'Add New User'}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? 'Update user details.' : 'Create a new system user.'} Click save when done.
                    </DialogDescription>
                </DialogHeader>

                <div className="max-h-[26rem] overflow-y-auto py-1 pe-1">
                    <Form {...form}>
                        <form id="user-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-0.5">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
                                        <FormLabel className="col-span-2 text-end">Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="John Doe" className="col-span-4" autoComplete="off" {...field} />
                                        </FormControl>
                                        <FormMessage className="col-span-4 col-start-3" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
                                        <FormLabel className="col-span-2 text-end">Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="john@example.com" className="col-span-4" autoComplete="off" {...field} />
                                        </FormControl>
                                        <FormMessage className="col-span-4 col-start-3" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
                                        <FormLabel className="col-span-2 text-end">Phone</FormLabel>
                                        <FormControl>
                                            <Input placeholder="+1234567890" className="col-span-4" {...field} />
                                        </FormControl>
                                        <FormMessage className="col-span-4 col-start-3" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
                                        <FormLabel className="col-span-2 text-end">Role</FormLabel>
                                        <SelectDropdown
                                            defaultValue={field.value}
                                            onValueChange={field.onChange}
                                            placeholder="Select role"
                                            className="col-span-4"
                                            items={roles.map(({ label, value }) => ({ label, value }))}
                                        />
                                        <FormMessage className="col-span-4 col-start-3" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
                                        <FormLabel className="col-span-2 text-end">Status</FormLabel>
                                        <SelectDropdown
                                            defaultValue={field.value}
                                            onValueChange={field.onChange}
                                            placeholder="Select status"
                                            className="col-span-4"
                                            items={statuses.map(({ label, value }) => ({ label, value }))}
                                        />
                                        <FormMessage className="col-span-4 col-start-3" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
                                        <FormLabel className="col-span-2 text-end">
                                            {isEdit ? 'New Password' : 'Password'}
                                        </FormLabel>
                                        <FormControl>
                                            <PasswordInput
                                                placeholder={isEdit ? 'Leave blank to keep current' : 'Min. 8 characters'}
                                                className="col-span-4"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage className="col-span-4 col-start-3" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
                                        <FormLabel className="col-span-2 text-end">Confirm</FormLabel>
                                        <FormControl>
                                            <PasswordInput
                                                disabled={!isPasswordTouched}
                                                placeholder="Repeat password"
                                                className="col-span-4"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage className="col-span-4 col-start-3" />
                                    </FormItem>
                                )}
                            />
                        </form>
                    </Form>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button type="submit" form="user-form" disabled={isLoading}>
                        {isLoading ? 'Saving…' : 'Save changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
