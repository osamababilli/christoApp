import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

/* ─── types ─── */
interface Invoice {
    id: number;
    invoice_number: string;
    description: string;
    issued_date: string;
    amount: number;
    paid: number;
    remaining: number;
}

interface Payment {
    type: string;
    type_label: string;
    amount: number;
    payment_method: string | null;
    payment_method_label: string | null;
    reference_no: string | null;
    invoice_number: string | null;
    notes: string | null;
    transaction_date: string;
}

interface Customer {
    id: number;
    name: string;
    phone: string;
    email: string | null;
    notes: string | null;
    is_loyal: boolean;
    account_type: 'direct' | 'account';
    opening_balance: number;
    opening_balance_notes: string | null;
    created_at: string;
}

interface Summary {
    total_invoices: number;
    total_invoiced: number;
    opening_balance: number;
    total_paid: number;
    total_remaining: number;
}

interface Filters {
    from: string | null;
    to: string | null;
}

interface Props {
    customer: Customer;
    invoices: Invoice[];
    payments: Payment[];
    summary: Summary;
    printed_at: string;
    filters: Filters;
    statement_number: string;
}

/* ─── helpers ─── */
const f = (n: number) => n.toFixed(2);

const S: Record<string, React.CSSProperties> = {
    page:    { fontFamily: "'Cairo', sans-serif", background: '#fff', color: '#111', minHeight: '100vh', direction: 'rtl' },
    toolbar: { position: 'sticky' as const, top: 0, zIndex: 10, display: 'flex', gap: 10, alignItems: 'center', padding: '10px 24px', background: '#18181b', borderBottom: '1px solid #3f3f46' },
    doc:     { maxWidth: 860, margin: '0 auto', padding: '36px 44px' },
    mono:    { fontFamily: "'IBM Plex Mono', 'Courier New', monospace" },
};

export default function CustomerStatement({ customer, invoices, payments, summary, printed_at, filters, statement_number }: Props) {
    useEffect(() => { document.title = `كشف حساب — ${customer.name}`; }, [customer.name]);

    const [fromDate, setFromDate] = useState(filters.from ?? '');
    const [toDate, setToDate]     = useState(filters.to ?? '');

    const isAccount  = customer.account_type === 'account';
    const fullyPaid  = summary.total_remaining <= 0.009;
    const hasFilter  = !!(filters.from || filters.to);
    const printedDate = new Date(printed_at).toLocaleDateString('ar-EG', {
        year: 'numeric', month: 'long', day: 'numeric',
    });

    function applyFilter() {
        router.get(
            `/customers/${customer.id}/statement`,
            { from: fromDate || undefined, to: toDate || undefined },
            { preserveState: true, preserveScroll: true },
        );
    }

    function clearFilter() {
        setFromDate('');
        setToDate('');
        router.get(`/customers/${customer.id}/statement`, {}, { preserveState: true, preserveScroll: true });
    }

    return (
        <div style={S.page}>

            {/* ── Toolbar ── */}
            <div className="no-print" style={{ ...S.toolbar, flexWrap: 'wrap' }}>
                <button
                    onClick={() => window.print()}
                    style={{ background: '#fff', color: '#18181b', border: 'none', borderRadius: 8, padding: '8px 22px', fontSize: 14, fontFamily: 'inherit', cursor: 'pointer', fontWeight: 700 }}
                >
                    🖨 طباعة / حفظ PDF
                </button>
                <button
                    onClick={() => window.history.back()}
                    style={{ background: 'transparent', color: '#a1a1aa', border: '1px solid #3f3f46', borderRadius: 8, padding: '8px 18px', fontSize: 14, fontFamily: 'inherit', cursor: 'pointer' }}
                >
                    ← رجوع
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginInlineStart: 8 }}>
                    <label style={{ fontSize: 12, color: '#a1a1aa' }}>من</label>
                    <input
                        type="date"
                        dir="ltr"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        style={{ background: '#27272a', color: '#fff', border: '1px solid #3f3f46', borderRadius: 6, padding: '6px 8px', fontSize: 13, fontFamily: 'inherit' }}
                    />
                    <label style={{ fontSize: 12, color: '#a1a1aa' }}>إلى</label>
                    <input
                        type="date"
                        dir="ltr"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        style={{ background: '#27272a', color: '#fff', border: '1px solid #3f3f46', borderRadius: 6, padding: '6px 8px', fontSize: 13, fontFamily: 'inherit' }}
                    />
                    <button
                        onClick={applyFilter}
                        style={{ background: '#fff', color: '#18181b', border: 'none', borderRadius: 6, padding: '7px 16px', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', fontWeight: 700 }}
                    >
                        تطبيق
                    </button>
                    {hasFilter && (
                        <button
                            onClick={clearFilter}
                            style={{ background: 'transparent', color: '#a1a1aa', border: '1px solid #3f3f46', borderRadius: 6, padding: '7px 14px', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}
                        >
                            إلغاء الفلترة
                        </button>
                    )}
                </div>

                <span style={{ fontSize: 12, color: '#71717a', marginRight: 4 }}>
                    {summary.total_invoices} فاتورة ·{' '}
                    {isAccount ? 'حساب جاري' : 'دفع مباشر'} · طُبع {printed_at}
                </span>
            </div>

            <div style={S.doc}>

                {/* ── Header ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, paddingBottom: 20, borderBottom: '3px solid #111' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, letterSpacing: 0.3 }}>ورشة غسان متري</h1>
                        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#71717a' }}>
                            {isAccount ? 'كشف الحساب الجاري' : 'كشف الحساب المالي الشامل'}
                        </p>
                        <p style={{ ...S.mono, margin: '6px 0 0', fontSize: 12, fontWeight: 700, color: '#111' }} dir="ltr">
                            {statement_number}
                        </p>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                        <p style={{ margin: 0, fontSize: 11, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>تاريخ الإصدار</p>
                        <p style={{ margin: '3px 0 0', fontSize: 13, fontWeight: 700 }}>{printedDate}</p>
                        {hasFilter && (
                            <p style={{ margin: '6px 0 0', fontSize: 11, color: '#71717a' }} dir="ltr">
                                {filters.from ?? '…'} → {filters.to ?? '…'}
                            </p>
                        )}
                    </div>
                </div>

                {/* ── Customer info ── */}
                <div style={{ border: '1px solid #e4e4e7', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
                    <div style={{ background: '#18181b', color: '#fff', padding: '8px 16px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        بيانات العميل
                    </div>
                    <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px 24px', fontSize: 13 }}>
                        <InfoRow label="الاسم"     value={customer.name} />
                        <InfoRow label="الهاتف"    value={customer.phone} ltr />
                        {customer.email && <InfoRow label="البريد" value={customer.email} ltr />}
                        <InfoRow label="عميل منذ" value={customer.created_at} ltr />
                        <div style={{ gridColumn: '1/-1', display: 'flex', gap: 8 }}>
                            {customer.is_loyal && (
                                <span style={{ display: 'inline-block', background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
                                    ⭐ عميل دائم
                                </span>
                            )}
                            <span style={{ display: 'inline-block', background: isAccount ? '#dbeafe' : '#f4f4f5', color: isAccount ? '#1e40af' : '#555', border: `1px solid ${isAccount ? '#bfdbfe' : '#e4e4e7'}`, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
                                {isAccount ? '🔄 حساب جاري' : '💳 دفع مباشر'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── Account summary ── */}
                <div style={{ border: '2px solid #111', borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
                    <div style={{ background: '#18181b', color: '#fff', padding: '10px 18px', fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        ملخص الحساب
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0 }}>
                        {[
                            { label: 'إجمالي الفواتير', value: `$${f(summary.total_invoiced)}`, color: '#111', bg: '#f9f9f9' },
                            summary.opening_balance > 0
                                ? { label: 'رصيد مرحّل', value: `$${f(summary.opening_balance)}`, color: '#92400e', bg: '#fffbeb' }
                                : { label: 'إجمالي المدفوع', value: `$${f(summary.total_paid)}`, color: '#16a34a', bg: '#f0fdf4' },
                            summary.opening_balance > 0
                                ? { label: 'إجمالي المدفوع', value: `$${f(summary.total_paid)}`, color: '#16a34a', bg: '#f0fdf4' }
                                : {
                                    label: 'المتبقي',
                                    value: fullyPaid ? '✓ مسدد بالكامل' : `$${f(summary.total_remaining)}`,
                                    color: fullyPaid ? '#16a34a' : '#dc2626',
                                    bg:    fullyPaid ? '#f0fdf4' : '#fff1f2',
                                  },
                        ].map((item, i) => (
                            <div key={i} style={{ padding: '16px 18px', borderRight: i < 2 ? '1px solid #e4e4e7' : 'none', background: item.bg }}>
                                <p style={{ margin: 0, fontSize: 11, color: '#71717a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{item.label}</p>
                                <p style={{ ...S.mono, margin: '5px 0 0', fontSize: 16, fontWeight: 900, color: item.color }}>{item.value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Invoices ── */}
                <SectionTitle>الفواتير الصادرة</SectionTitle>
                {invoices.length === 0 ? (
                    <p style={{ fontSize: 13, color: '#a1a1aa', marginBottom: 28, textAlign: 'center', padding: '20px', border: '1px dashed #e4e4e7', borderRadius: 8 }}>
                        لا توجد فواتير صادرة لهذا العميل
                    </p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 28 }}>
                        <thead>
                            <tr style={{ background: '#18181b', color: '#fff' }}>
                                <Th>#</Th>
                                <Th>رقم الفاتورة</Th>
                                <Th>البيان</Th>
                                <Th>تاريخ الإصدار</Th>
                                <Th align="center">المبلغ</Th>
                                <Th align="center">المتبقي</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map((invoice, i) => (
                                <tr key={invoice.id} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                                    <Td align="center">{i + 1}</Td>
                                    <Td mono bold>{invoice.invoice_number}</Td>
                                    <Td>{invoice.description}</Td>
                                    <Td ltr>{invoice.issued_date}</Td>
                                    <Td align="center" mono bold>${f(invoice.amount)}</Td>
                                    <Td align="center" mono bold style={{ color: invoice.remaining <= 0.009 ? '#16a34a' : '#dc2626' }}>
                                        {invoice.remaining <= 0.009 ? '✓ مسدد' : `$${f(invoice.remaining)}`}
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr style={{ background: '#f4f4f5', borderTop: '2px solid #e4e4e7' }}>
                                <td colSpan={4} style={{ padding: '8px 10px', fontWeight: 800, fontSize: 13, textAlign: 'right' }}>إجمالي الفواتير</td>
                                <td style={{ padding: '8px 10px', textAlign: 'center', ...S.mono, fontWeight: 900, fontSize: 14, color: '#111' }}>
                                    ${f(summary.total_invoiced)}
                                </td>
                                <td />
                            </tr>
                        </tfoot>
                    </table>
                )}

                {/* ── Payments ── */}
                <SectionTitle>سجل الدفعات</SectionTitle>
                {payments.length === 0 && summary.opening_balance <= 0 ? (
                    <p style={{ fontSize: 13, color: '#a1a1aa', marginBottom: 28, textAlign: 'center', padding: '20px', border: '1px dashed #e4e4e7', borderRadius: 8 }}>
                        لا توجد دفعات مسجلة
                    </p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 28 }}>
                        <thead>
                            <tr style={{ background: '#18181b', color: '#fff' }}>
                                <Th>#</Th>
                                <Th>التاريخ</Th>
                                <Th>النوع</Th>
                                <Th>مقابل</Th>
                                <Th>طريقة الدفع</Th>
                                <Th>ملاحظة</Th>
                                <Th align="center">المبلغ</Th>
                                <Th align="center">الرصيد المتبقي</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Opening balance row */}
                            {summary.opening_balance > 0 && (
                                <tr style={{ background: '#fffbeb', borderBottom: '1px solid #fde68a' }}>
                                    <Td align="center">—</Td>
                                    <Td ltr>—</Td>
                                    <Td>
                                        <span style={{ display: 'inline-block', background: '#fef3c7', color: '#92400e', borderRadius: 12, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>
                                            رصيد مرحّل
                                        </span>
                                    </Td>
                                    <Td>—</Td>
                                    <Td>—</Td>
                                    <Td>{customer.opening_balance_notes ?? '—'}</Td>
                                    <Td align="center" mono bold style={{ color: '#92400e' }}>${f(summary.opening_balance)}</Td>
                                    <Td align="center" mono bold style={{ color: '#dc2626' }}>${f(summary.total_invoiced + summary.opening_balance)}</Td>
                                </tr>
                            )}
                            {(() => {
                                let running = summary.total_invoiced + summary.opening_balance;
                                return payments.map((p, i) => {
                                    running -= p.amount;
                                    const rem = running;
                                    const against = p.invoice_number ?? 'دفعة عامة';
                                    const method = p.payment_method_label
                                        ? `${p.payment_method_label}${p.reference_no ? ` — ${p.reference_no}` : ''}`
                                        : '—';
                                    return (
                                        <tr key={i} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? '#fff' : '#f0fdf4' }}>
                                            <Td align="center">{i + 1}</Td>
                                            <Td ltr>{p.transaction_date}</Td>
                                            <Td>
                                                <span style={{ display: 'inline-block', background: p.type === 'payment' ? '#dcfce7' : '#f3e8ff', color: p.type === 'payment' ? '#16a34a' : '#7c3aed', borderRadius: 12, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>
                                                    {p.type_label}
                                                </span>
                                            </Td>
                                            <Td mono>{against}</Td>
                                            <Td>{method}</Td>
                                            <Td>{p.notes ?? '—'}</Td>
                                            <Td align="center" mono bold green>${f(p.amount)}</Td>
                                            <Td align="center" mono bold style={{ color: rem <= 0.009 ? '#16a34a' : '#dc2626' }}>
                                                {rem <= 0.009 ? '✓ مسدد' : `$${f(rem)}`}
                                            </Td>
                                        </tr>
                                    );
                                });
                            })()}
                        </tbody>
                        <tfoot>
                            <tr style={{ background: '#f4f4f5', borderTop: '2px solid #e4e4e7' }}>
                                <td colSpan={6} style={{ padding: '8px 10px', fontWeight: 800, fontSize: 13, textAlign: 'right' }}>إجمالي المدفوع</td>
                                <td style={{ padding: '8px 10px', textAlign: 'center', ...S.mono, fontWeight: 900, fontSize: 14, color: '#16a34a' }}>
                                    ${f(summary.total_paid)}
                                </td>
                                <td style={{ padding: '8px 10px', textAlign: 'center', ...S.mono, fontWeight: 900, fontSize: 14, color: fullyPaid ? '#16a34a' : '#dc2626' }}>
                                    {fullyPaid ? '✓ مسدد' : `$${f(summary.total_remaining)}`}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                )}

                {/* ── Grand total ── */}
                <div style={{ border: '2px solid #111', borderRadius: 12, overflow: 'hidden', marginTop: 8 }}>
                    <div style={{ background: '#18181b', color: '#fff', padding: '10px 18px', fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        الملخص الإجمالي
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0 }}>
                        {[
                            { label: 'إجمالي الفواتير', value: `$${f(summary.total_invoiced)}`,           color: '#111',    bg: '#f9f9f9' },
                            { label: 'إجمالي المدفوع',  value: `$${f(summary.total_paid)}`,               color: '#16a34a', bg: '#f0fdf4' },
                            {
                                label: 'المتبقي',
                                value: fullyPaid ? '✓ مسدد بالكامل' : `$${f(summary.total_remaining)}`,
                                color: fullyPaid ? '#16a34a' : '#dc2626',
                                bg:    fullyPaid ? '#f0fdf4' : '#fff1f2',
                            },
                        ].map((item, i) => (
                            <div key={i} style={{ padding: '16px 18px', borderRight: i < 2 ? '1px solid #e4e4e7' : 'none', background: item.bg }}>
                                <p style={{ margin: 0, fontSize: 11, color: '#71717a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{item.label}</p>
                                <p style={{ ...S.mono, margin: '5px 0 0', fontSize: 16, fontWeight: 900, color: item.color }}>{item.value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Footer ── */}
                <div style={{ marginTop: 32, paddingTop: 14, borderTop: '1px solid #e4e4e7', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#a1a1aa' }}>
                    <span>ورشة غسان متري — {isAccount ? 'كشف الحساب الجاري' : 'كشف الحساب المالي'} — {statement_number}</span>
                    <span>طُبع بتاريخ: {printedDate}</span>
                </div>
            </div>
        </div>
    );
}

/* ─── helper components ─── */

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{children}</p>
            <div style={{ flex: 1, height: 1, background: '#e4e4e7' }} />
        </div>
    );
}

function InfoRow({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
    return (
        <div>
            <span style={{ color: '#71717a', fontSize: 11 }}>{label}: </span>
            <span style={{ fontWeight: 700, direction: ltr ? 'ltr' : undefined, unicodeBidi: ltr ? 'embed' : undefined }}>{value}</span>
        </div>
    );
}

function Th({ children, align }: { children: React.ReactNode; align?: string }) {
    return (
        <th style={{ padding: '7px 10px', textAlign: (align ?? 'right') as React.CSSProperties['textAlign'], fontWeight: 700, borderBottom: '1px solid #333', color: '#d4d4d8', fontSize: 11 }}>
            {children}
        </th>
    );
}

function Td({ children, align, mono, bold, green, ltr, style: extra }: {
    children: React.ReactNode; align?: string; mono?: boolean; bold?: boolean; green?: boolean; ltr?: boolean; style?: React.CSSProperties;
}) {
    return (
        <td style={{
            padding: '6px 10px',
            textAlign: (align ?? 'right') as React.CSSProperties['textAlign'],
            color: green ? '#16a34a' : '#333',
            fontWeight: bold ? 700 : 400,
            direction: ltr ? 'ltr' : undefined,
            ...(mono ? { fontFamily: "'IBM Plex Mono', monospace" } : {}),
            ...extra,
        }}>
            {children}
        </td>
    );
}
