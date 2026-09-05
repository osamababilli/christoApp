import { Customers } from '@/features/customers';

export default function CustomersPage(props: React.ComponentProps<typeof Customers>) {
    return <Customers {...props} />;
}
