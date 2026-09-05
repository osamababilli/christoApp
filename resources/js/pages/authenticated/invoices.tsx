import { Invoices } from '@/features/invoices/index';

export default function InvoicesPage(props: React.ComponentProps<typeof Invoices>) {
    return <Invoices {...props} />;
}
