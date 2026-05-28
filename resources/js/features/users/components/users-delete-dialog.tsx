import { ConfirmDialog } from '@/components/confirm-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { router } from '@inertiajs/react';
import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { type User } from '../data/schema';

type UsersDeleteDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentRow: User;
};

export function UsersDeleteDialog({ open, onOpenChange, currentRow }: UsersDeleteDialogProps) {
    const [value, setValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const confirmed = value.trim() === currentRow.email;

    const handleDelete = () => {
        if (!confirmed) return;
        setIsLoading(true);
        router.delete(`/settings/users/${currentRow.id}`, {
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
                    Delete User
                </span>
            }
            desc={
                <div className="space-y-4">
                    <p>
                        Are you sure you want to delete{' '}
                        <span className="font-bold">{currentRow.name}</span>?
                        <br />
                        This action cannot be undone.
                    </p>
                    <Label className="flex flex-col gap-1.5">
                        <span>Type the user&apos;s email to confirm:</span>
                        <Input
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder={currentRow.email}
                        />
                    </Label>
                    <Alert variant="destructive">
                        <AlertTitle>Warning</AlertTitle>
                        <AlertDescription>This will permanently remove the user from the system.</AlertDescription>
                    </Alert>
                </div>
            }
            confirmText={isLoading ? 'Deleting…' : 'Delete'}
            destructive
        />
    );
}
