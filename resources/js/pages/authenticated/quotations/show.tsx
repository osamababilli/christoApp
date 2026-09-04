import { QuotationShow } from '@/features/quotations/quotation-show';

export default function QuotationShowPage({ quotation, employees }: any) {
    return <QuotationShow quotation={quotation} employees={employees} />;
}
