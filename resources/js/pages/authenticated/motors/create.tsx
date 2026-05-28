import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { ThemeSwitch } from '@/components/theme-switch';
import { Button } from '@/components/ui/button';
import { type CustomerOption } from '@/features/motors/customer-combobox';
import { MotorForm, type CategoryOption } from '@/features/motors/motor-form';
import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';

interface Props {
    customers: CustomerOption[];
    categories: CategoryOption[];
}

export default function MotorCreatePage({ customers, categories }: Props) {
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
                <MotorForm
                    title="تسجيل قيد استلام جديد"
                    action="/motors"
                    method="post"
                    customers={customers}
                    categories={categories}
                />
            </Main>
        </>
    );
}
