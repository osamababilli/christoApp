import { QuotationsList } from '@/features/quotations';

export default function QuotationsPage({ quotations, filters }: any) {
    return <QuotationsList quotations={quotations} filters={filters} />;
}
