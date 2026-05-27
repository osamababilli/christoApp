import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { ThemeSwitch } from '@/components/theme-switch';
import { Button } from '@/components/ui/button';
import { type CustomerOption } from '@/features/motors/customer-combobox';
import { MotorForm } from '@/features/motors/motor-form';
import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';

interface Props {
    customers: CustomerOption[];
    motor: {
        id: number;
        reference_number: string;
        customer_id: number;
        customer_name: string;
        customer_phone: string;
        brand: string | null;
        model: string | null;
        status: string;
        condition_rating: string | null;
        notes: string | null;
        received_at: string;
        delivered_at: string | null;
    };
}

export default function MotorEditPage({ customers, motor }: Props) {
    return (
        <>
            <Header>
                <Link href={`/motors/${motor.id}`}>
                    <Button variant="ghost" size="sm" className="gap-2">
                        <ArrowRight className="h-4 w-4" />
                        العودة للموتور
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
                    defaultValues={{
                        customer_id:      motor.customer_id,
                        customer_name:    motor.customer_name,
                        customer_phone:   motor.customer_phone,
                        brand:            motor.brand ?? '',
                        model:            motor.model ?? '',
                        status:           motor.status,
                        condition_rating: motor.condition_rating ?? '',
                        notes:            motor.notes ?? '',
                        received_at:      motor.received_at,
                        delivered_at:     motor.delivered_at ?? '',
                    }}
                />
            </Main>
        </>
    );
}
