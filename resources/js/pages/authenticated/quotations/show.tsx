import { QuotationShow } from '@/features/quotations/quotation-show';

export default function QuotationShowPage({ quotation, categories, employees }: any) {
    return <QuotationShow quotation={quotation} categories={categories} employees={employees} />;
}
