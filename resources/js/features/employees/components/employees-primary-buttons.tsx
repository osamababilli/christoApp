import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { useEmployees } from './employees-provider';

export function EmployeesPrimaryButtons() {
    const { setOpen } = useEmployees();
    return (
        <Button className="gap-2" onClick={() => setOpen('add')}>
            <UserPlus size={18} />
            إضافة موظف
        </Button>
    );
}
