import { useEffect } from 'react';

interface Payment {
    id: number;
    amount: number;
    payment_method: string | null;
    transaction_date: string | null;
    notes: string | null;
}

interface InvoicePrint {
    id: number;
    invoice_number: string;
    customer_name: string;
    motor_reference: string | null;
    description: string;
    amount: number;
    paid: number;
    remaining: number;
    is_paid: boolean;
    issued_date: string;
    notes: string | null;
    payments: Payment[];
}

export default function InvoicePrint({ invoice }: { invoice: InvoicePrint }) {
    useEffect(() => {
        document.title = `فاتورة — ${invoice.invoice_number}`;
    }, []);

    const issuedDate = new Date(invoice.issued_date).toLocaleDateString('ar-SA');

    return (
        <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", background: '#fff', color: '#111', minHeight: '100vh' }}>
            {/* Toolbar — hidden when printing */}
            <div
                className="no-print"
                style={{
                    padding: '12px 24px',
                    background: '#f4f4f5',
                    borderBottom: '1px solid #e4e4e7',
                    display: 'flex',
                    gap: 10,
                    alignItems: 'center',
                }}
            >
                <button
                    onClick={() => window.print()}
                    style={{
                        background: '#111',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '8px 22px',
                        fontSize: 14,
                        fontFamily: 'inherit',
                        cursor: 'pointer',
                        fontWeight: 700,
                    }}
                >
                    🖨 طباعة / تحميل PDF
                </button>
                <button
                    onClick={() => window.history.back()}
                    style={{
                        background: '#fff',
                        color: '#333',
                        border: '1px solid #d4d4d8',
                        borderRadius: 8,
                        padding: '8px 18px',
                        fontSize: 14,
                        fontFamily: 'inherit',
                        cursor: 'pointer',
                    }}
                >
                    ← رجوع
                </button>
                <span style={{ fontSize: 13, color: '#71717a', marginRight: 8 }}>لتحميل PDF: اختر "حفظ كـ PDF" من نافذة الطباعة</span>
            </div>

            <div style={{ maxWidth: 820, margin: '0 auto', padding: '36px 44px' }}>
                {/* ── Header ── */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 28,
                        paddingBottom: 20,
                        borderBottom: '3px solid #111',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <img src="/images/brand/logo-color.png" alt="ورشة غسان متري" style={{ height: 100, width: 'auto', objectFit: 'contain' }} />
                        <div>
                            <p style={{ fontSize: 13, color: '#555', margin: 0 }}>للصيانة الميكانيكية والكهربائية</p>
                            <p style={{ fontSize: 11, color: '#777', margin: '6px 0 0' }}>
                                رقم مالي: ٩٥٠٠١٧ &nbsp;|&nbsp; هاتف: ٧٦١٦٩٠٠٨ &nbsp;|&nbsp; info@ghassan-mitri.com
                            </p>
                        </div>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                        <div style={{ display: 'inline-block', border: '2px solid #111', borderRadius: 8, padding: '8px 20px', textAlign: 'center' }}>
                            <p style={{ margin: 0, fontSize: 11, color: '#777', textTransform: 'uppercase', letterSpacing: 2 }}>فاتورة</p>
                            <p style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 900, fontFamily: 'monospace', letterSpacing: 2 }}>
                                {invoice.invoice_number}
                            </p>
                        </div>
                        <p style={{ margin: '8px 0 0', fontSize: 12, color: '#777', textAlign: 'left' }}>تاريخ الإصدار: {issuedDate}</p>
                    </div>
                </div>

                {/* ── Customer / invoice info ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                    <InfoBox title="بيانات العميل">
                        <InfoRow label="الاسم" value={invoice.customer_name} />
                        {invoice.motor_reference && <InfoRow label="القيد المرتبط" value={invoice.motor_reference} mono />}
                    </InfoBox>
                    <InfoBox title="حالة الفاتورة">
                        <InfoRow label="رقم الفاتورة" value={invoice.invoice_number} mono />
                        <InfoRow label="تاريخ الإصدار" value={issuedDate} />
                        <InfoRow label="الحالة" value={invoice.is_paid ? 'مسدّدة بالكامل' : 'متبقٍ عليها رصيد'} />
                    </InfoBox>
                </div>

                {/* ── Description ── */}
                <SectionTitle>وصف الفاتورة</SectionTitle>
                <div style={{ marginBottom: 24, padding: '12px 16px', border: '1px solid #e4e4e7', borderRadius: 8, background: '#fafafa' }}>
                    <p style={{ margin: 0, fontSize: 14, color: '#333' }}>{invoice.description}</p>
                </div>

                {invoice.notes && (
                    <div style={{ marginBottom: 24, padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8 }}>
                        <p style={{ margin: 0, fontSize: 12, color: '#92400e', fontWeight: 700 }}>ملاحظات</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#78350f' }}>{invoice.notes}</p>
                    </div>
                )}

                {/* ── Payments ── */}
                <SectionTitle>الدفعات المسجّلة</SectionTitle>
                {invoice.payments.length === 0 ? (
                    <p style={{ color: '#999', fontSize: 13, marginBottom: 20 }}>لا توجد دفعات مسجّلة على هذه الفاتورة</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 24 }}>
                        <thead>
                            <tr style={{ background: '#111', color: '#fff' }}>
                                <Th light>#</Th>
                                <Th light>التاريخ</Th>
                                <Th light>طريقة الدفع</Th>
                                <Th light>ملاحظات</Th>
                                <Th light align="center">
                                    المبلغ
                                </Th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.payments.map((p, i) => (
                                <tr key={p.id} style={{ borderBottom: '1px solid #e4e4e7', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                                    <Td align="center" muted>
                                        {i + 1}
                                    </Td>
                                    <Td>{p.transaction_date ?? '—'}</Td>
                                    <Td>{p.payment_method ?? '—'}</Td>
                                    <Td muted>{p.notes ?? '—'}</Td>
                                    <Td align="center">
                                        <strong>{p.amount.toFixed(2)}</strong>
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* ── Totals ── */}
                <div style={{ marginBottom: 32 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                        <tbody>
                            <SummaryRow label="إجمالي الفاتورة" value={invoice.amount.toFixed(2)} />
                            <SummaryRow label="إجمالي المدفوع" value={invoice.paid.toFixed(2)} />
                            <tr>
                                <td colSpan={2}>
                                    <div style={{ height: 1, background: '#111', margin: '4px 0' }} />
                                </td>
                            </tr>
                            <tr style={{ background: '#111', color: '#fff' }}>
                                <td style={{ padding: '12px 16px', fontWeight: 900, fontSize: 16 }}>
                                    {invoice.is_paid ? 'مسدّدة بالكامل' : 'المتبقي'}
                                </td>
                                <td
                                    style={{
                                        padding: '12px 16px',
                                        textAlign: 'left',
                                        fontWeight: 900,
                                        fontSize: 20,
                                        fontFamily: 'monospace',
                                        letterSpacing: 1,
                                    }}
                                >
                                    {invoice.remaining.toFixed(2)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* ── Signatures ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginBottom: 24 }}>
                    <SignatureBox label="توقيع مندوب الورشة" />
                    <SignatureBox label="توقيع العميل / استلام الفاتورة" />
                </div>

                {/* ── Footer ── */}
                <div
                    style={{
                        marginTop: 24,
                        paddingTop: 14,
                        borderTop: '1px solid #e4e4e7',
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 11,
                        color: '#999',
                    }}
                >
                    <span>طُبع بتاريخ: {new Date().toLocaleDateString('ar-SA')}</span>
                    <span>فاتورة رقم: {invoice.invoice_number}</span>
                </div>
            </div>

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    @page { margin: 15mm; size: A4; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            `}</style>
        </div>
    );
}

/* ── Helper Components ── */

function InfoBox({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ border: '1px solid #e4e4e7', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ background: '#f4f4f5', padding: '6px 14px', fontWeight: 800, fontSize: 13, borderBottom: '1px solid #e4e4e7' }}>
                {title}
            </div>
            <div style={{ padding: '10px 14px', fontSize: 13 }}>{children}</div>
        </div>
    );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ color: '#777' }}>{label}:</span>
            <span style={{ fontWeight: 600, fontFamily: mono ? 'monospace' : undefined }}>{value}</span>
        </div>
    );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>{children}</h3>
            <div style={{ flex: 1, height: 1, background: '#e4e4e7' }} />
        </div>
    );
}

function Th({ children, align, light }: { children: React.ReactNode; align?: string; light?: boolean }) {
    return (
        <th
            style={{
                padding: '9px 12px',
                textAlign: (align ?? 'right') as React.CSSProperties['textAlign'],
                fontWeight: 700,
                fontSize: 12,
                color: light ? '#fff' : '#555',
                borderBottom: '1px solid #e4e4e7',
            }}
        >
            {children}
        </th>
    );
}

function Td({ children, align, muted }: { children: React.ReactNode; align?: string; muted?: boolean }) {
    return (
        <td style={{ padding: '8px 12px', textAlign: (align ?? 'right') as React.CSSProperties['textAlign'], color: muted ? '#999' : '#333' }}>
            {children}
        </td>
    );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
    return (
        <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
            <td style={{ padding: '8px 16px', color: '#555', fontSize: 14 }}>{label}</td>
            <td style={{ padding: '8px 16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>{value}</td>
        </tr>
    );
}

function SignatureBox({ label }: { label: string }) {
    return (
        <div>
            <p style={{ margin: '0 0 8px', fontSize: 12, color: '#555', fontWeight: 600 }}>{label}</p>
            <div style={{ height: 60, border: '1px dashed #ccc', borderRadius: 6 }} />
            <p style={{ margin: '6px 0 0', fontSize: 11, color: '#aaa' }}>الاسم: ..................................</p>
        </div>
    );
}
