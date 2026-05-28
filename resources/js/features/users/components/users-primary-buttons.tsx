import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { useUsers } from './users-provider';

export function UsersPrimaryButtons() {
    const { setOpen } = useUsers();
    return (
        <Button className="gap-2" onClick={() => setOpen('add')}>
            <UserPlus size={18} />
            Add User
        </Button>
    );
}
