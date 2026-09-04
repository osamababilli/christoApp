import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { ThemeSwitch } from '@/components/theme-switch';
import { Button } from '@/components/ui/button';
import { type CustomerOption } from '@/features/motors/customer-combobox';
import { type EmployeeOption } from '@/features/motors/motor-form';
import { MotorIntakeForm } from '@/features/motors/motor-intake-form';
import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';

interface SupplierOption {
    id: number;
    name: string;
}

interface Props {
    customers: CustomerOption[];
    employees: EmployeeOption[];
    suppliers: SupplierOption[];
}

export default function MotorCreatePage({ customers, employees, suppliers }: Props) {
    return (
        <>
            <Header>
                <Link href="/motors">
                    <Button variant="ghost" size="sm" className="gap-2">
                        <ArrowRight className="h-4 w-4" />
                        العودة للقائمة
                    </Button>
                </Link>
                <div className="ms-auto flex items-center gap-3">
                    <ThemeSwitch />
                    <ProfileDropdown />
                </div>
            </Header>
            <Main>
                <MotorIntakeForm
                    customers={customers}
                    employees={employees}
                    suppliers={suppliers}
                />
            </Main>
        </>
    );
}
