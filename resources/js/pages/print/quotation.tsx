import { downloadElementAsPdf } from '@/lib/download-pdf';
import { useEffect, useState } from 'react';

interface ServiceItem {
    description: string;
    labor_cost: number;
}

interface PartItem {
    description: string;
    part_type_label: string;
    quantity: number;
    unit_price: number;
    total_price: number;
}

interface QuotationPrint {
    id: number;
    reference_number: string;
    customer: { name: string; phone: string };
    notes: string | null;
    valid_days: number;
    created_at: string;
    services: ServiceItem[];
    parts: PartItem[];
}

export default function QuotationPrint({ quotation }: { quotation: QuotationPrint }) {
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        document.title = `عرض سعر — ${quotation.reference_number}`;
    }, []);

    async function handleDownload() {
        setIsGenerating(true);
        try {
            await downloadElementAsPdf('print-content', `عرض-سعر-${quotation.reference_number}`);
        } finally {
            setIsGenerating(false);
        }
    }

    const totalLabor = quotation.services.reduce((s, i) => s + i.labor_cost, 0);
    const totalParts = quotation.parts.reduce((s, i) => s + i.total_price, 0);
    const grandTotal = totalLabor + totalParts;
    const quoteDate = new Date(quotation.created_at).toLocaleDateString('ar-SA');

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
                    onClick={handleDownload}
                    disabled={isGenerating}
                    style={{
                        background: '#111',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '8px 22px',
                        fontSize: 14,
                        fontFamily: 'inherit',
                        cursor: isGenerating ? 'default' : 'pointer',
                        fontWeight: 700,
                        opacity: isGenerating ? 0.7 : 1,
                    }}
                >
                    {isGenerating ? '... جارٍ التحميل' : '⬇ تحميل PDF'}
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
                <span style={{ fontSize: 13, color: '#71717a', marginRight: 8 }}>سيتم تحميل الملف مباشرة كملف PDF</span>
            </div>

            <div id="print-content" style={{ maxWidth: 820, margin: '0 auto', padding: '36px 44px' }}>
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
                            <p style={{ margin: 0, fontSize: 11, color: '#777', textTransform: 'uppercase', letterSpacing: 2 }}>عرض سعر</p>
                            <p style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 900, fontFamily: 'monospace', letterSpacing: 2 }}>
                                {quotation.reference_number}
                            </p>
                        </div>
                        <p style={{ margin: '8px 0 0', fontSize: 12, color: '#777', textAlign: 'left' }}>تاريخ العرض: {quoteDate}</p>
                    </div>
                </div>

                {/* ── Customer info ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                    <InfoBox title="بيانات العميل">
                        <InfoRow label="الاسم" value={quotation.customer.name} />
                        <InfoRow label="الهاتف" value={quotation.customer.phone} ltr />
                    </InfoBox>
                    <InfoBox title="تفاصيل العرض">
                        <InfoRow label="رقم العرض" value={quotation.reference_number} mono />
                        <InfoRow label="تاريخ الإصدار" value={quoteDate} />
                        <InfoRow label="صلاحية العرض" value={`${quotation.valid_days} يوماً`} />
                    </InfoBox>
                </div>

                {/* ── Notes banner ── */}
                {quotation.notes && (
                    <div style={{ marginBottom: 24, padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8 }}>
                        <p style={{ margin: 0, fontSize: 12, color: '#92400e', fontWeight: 700 }}>ملاحظات</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#78350f' }}>{quotation.notes}</p>
                    </div>
                )}

                {/* ── Services ── */}
                <SectionTitle>أولاً: خدمات الصيانة</SectionTitle>
                {quotation.services.length === 0 ? (
                    <p style={{ color: '#999', fontSize: 13, marginBottom: 20 }}>لا توجد خدمات صيانة</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 24 }}>
                        <thead>
                            <tr style={{ background: '#111', color: '#fff' }}>
                                <Th light>#</Th>
                                <Th light>وصف الخدمة</Th>
                                <Th light align="center">
                                    تكلفة العمالة
                                </Th>
                            </tr>
                        </thead>
                        <tbody>
                            {quotation.services.map((svc, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #e4e4e7', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                                    <Td align="center" muted>
                                        {i + 1}
                                    </Td>
                                    <Td>{svc.description || '—'}</Td>
                                    <Td align="center">
                                        <strong>{svc.labor_cost.toFixed(2)}</strong>
                                    </Td>
                                </tr>
                            ))}
                            <tr style={{ background: '#f4f4f5', borderTop: '2px solid #e4e4e7' }}>
                                <td colSpan={2} style={{ padding: '8px 12px', fontWeight: 700, fontSize: 13, textAlign: 'right' }}>
                                    إجمالي خدمات الصيانة
                                </td>
                                <td style={{ padding: '8px 12px', fontWeight: 800, fontSize: 14, textAlign: 'center' }}>{totalLabor.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                )}

                {/* ── Parts ── */}
                <SectionTitle>ثانياً: القطع والمستلزمات</SectionTitle>
                {quotation.parts.length === 0 ? (
                    <p style={{ color: '#999', fontSize: 13, marginBottom: 24 }}>لا توجد قطع أو مستلزمات</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 24 }}>
                        <thead>
                            <tr style={{ background: '#111', color: '#fff' }}>
                                <Th light>#</Th>
                                <Th light>اسم القطعة / المستلزم</Th>
                                <Th light>النوع</Th>
                                <Th light align="center">
                                    الكمية
                                </Th>
                                <Th light align="center">
                                    سعر الوحدة
                                </Th>
                                <Th light align="center">
                                    الإجمالي
                                </Th>
                            </tr>
                        </thead>
                        <tbody>
                            {quotation.parts.map((p, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #e4e4e7', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                                    <Td align="center" muted>
                                        {i + 1}
                                    </Td>
                                    <Td>
                                        <strong>{p.description}</strong>
                                    </Td>
                                    <Td>
                                        {p.part_type_label ? (
                                            <span
                                                style={{ background: '#eff6ff', color: '#1d4ed8', borderRadius: 4, padding: '2px 8px', fontSize: 12 }}
                                            >
                                                {p.part_type_label}
                                            </span>
                                        ) : (
                                            '—'
                                        )}
                                    </Td>
                                    <Td align="center">{p.quantity}</Td>
                                    <Td align="center">{p.unit_price.toFixed(2)}</Td>
                                    <Td align="center">
                                        <strong>{p.total_price.toFixed(2)}</strong>
                                    </Td>
                                </tr>
                            ))}
                            <tr style={{ background: '#f4f4f5', borderTop: '2px solid #e4e4e7' }}>
                                <td colSpan={5} style={{ padding: '8px 12px', fontWeight: 700, fontSize: 13, textAlign: 'right' }}>
                                    إجمالي القطع والمستلزمات
                                </td>
                                <td style={{ padding: '8px 12px', fontWeight: 800, fontSize: 14, textAlign: 'center' }}>{totalParts.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                )}

                {/* ── Grand Total ── */}
                <div style={{ marginBottom: 32 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                        <tbody>
                            <SummaryRow label="إجمالي خدمات الصيانة" value={totalLabor.toFixed(2)} />
                            <SummaryRow label="إجمالي القطع والمستلزمات" value={totalParts.toFixed(2)} />
                            <tr>
                                <td colSpan={2}>
                                    <div style={{ height: 1, background: '#111', margin: '4px 0' }} />
                                </td>
                            </tr>
                            <tr style={{ background: '#111', color: '#fff' }}>
                                <td style={{ padding: '12px 16px', fontWeight: 900, fontSize: 16 }}>الإجمالي الكلي</td>
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
                                    {grandTotal.toFixed(2)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* ── Signatures ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginBottom: 24 }}>
                    <SignatureBox label="توقيع مندوب الورشة" />
                    <SignatureBox label="توقيع العميل / الموافقة على العرض" />
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
                    <span>عرض سعر رقم: {quotation.reference_number}</span>
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

function InfoRow({ label, value, ltr, mono }: { label: string; value: string; ltr?: boolean; mono?: boolean }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ color: '#777' }}>{label}:</span>
            <span style={{ fontWeight: 600, direction: ltr ? 'ltr' : undefined, fontFamily: mono ? 'monospace' : undefined }}>{value}</span>
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
