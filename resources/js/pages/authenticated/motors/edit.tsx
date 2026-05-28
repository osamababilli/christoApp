import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { ThemeSwitch } from '@/components/theme-switch';
import { Button } from '@/components/ui/button';
import { type CustomerOption } from '@/features/motors/customer-combobox';
import { MotorForm, type CategoryOption, type EmployeeOption } from '@/features/motors/motor-form';
import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';

interface Props {
    customers: CustomerOption[];
    categories: CategoryOption[];
    employees: EmployeeOption[];
    motor: {
        id: number;
        reference_number: string;
        customer_id: number;
        customer_name: string;
        customer_phone: string;
        category_id: number | null;
        status: string;
        notes: string | null;
        received_at: string;
        delivered_at: string | null;
        received_by: number | null;
    };
}

export default function MotorEditPage({ customers, categories, employees, motor }: Props) {
    return (
        <>
            <Header>
                <Link href={`/motors/${motor.id}`}>
                    <Button variant="ghost" size="sm" className="gap-2">
                        <ArrowRight className="h-4 w-4" />
                        العودة لقيد الاستلام
                    </Button>
                </Link>
                <div className="ms-auto flex items-center gap-3">
                    <ThemeSwitch />
                    <ProfileDropdown />
                </div>
            </Header>
            <Main>
                <MotorForm
                    title={`تعديل: ${motor.reference_number}`}
                    action={`/motors/${motor.id}`}
                    method="put"
                    showDeliveredAt
                    customers={customers}
                    categories={categories}
                    employees={employees}
                    defaultValues={{
                        customer_id:      motor.customer_id,
                        customer_name:    motor.customer_name,
                        customer_phone:   motor.customer_phone,
                        category_id:      motor.category_id,
                        status:           motor.status,
                        notes:            motor.notes ?? '',
                        delivered_at:     motor.delivered_at ?? '',
                        received_by:      motor.received_by,
                    }}
                />
            </Main>
        </>
    );
}
