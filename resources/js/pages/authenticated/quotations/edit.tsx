import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { ThemeSwitch } from '@/components/theme-switch';
import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { QuotationForm } from '@/features/quotations/quotation-form';
import type { CustomerOption } from '@/features/motors/customer-combobox';

interface Props {
    quotation: NonNullable<React.ComponentProps<typeof QuotationForm>['quotation']>;
    customers: CustomerOption[];
}

export default function QuotationsEditPage({ quotation, customers }: Props) {
    return (
        <>
            <Header>
                <Link href={`/quotations/${quotation.id}`}>
                    <Button variant="ghost" size="sm" className="gap-2">
                        <ArrowRight className="h-4 w-4" />
                        العودة للعرض
                    </Button>
                </Link>
                <div className="ms-auto flex items-center gap-3">
                    <ThemeSwitch />
                    <ProfileDropdown />
                </div>
            </Header>
            <Main>
                <QuotationForm quotation={quotation} customers={customers} isEdit />
            </Main>
        </>
    );
}
