import { useEffect } from 'react';

/* ─── types ─── */
interface Part {
    part_name: string;
    type_label: string;
    purchased_by: string;
    quantity: number;
    unit_cost: number;
    unit_price: number;
    total_cost: number;
    supplier_name: string | null;
}

interface MaintenanceOrder {
    stage: number;
    description: string;
    status_label: string;
    started_at: string | null;
    completed_at: string | null;
    labor_cost: number;
    parts: Part[];
}

interface Transaction {
    type_label: string;
    amount: number;
    notes: string | null;
    transaction_date: string;
}

interface Motor {
    id: number;
    reference_number: string;
    status_label: string;
    received_at: string | null;
    delivered_at: string | null;
    category_name: string | null;
    notes: string | null;
    grand_total: number;
    total_paid: number;
    remaining: number;
    maintenance_orders: MaintenanceOrder[];
    transactions: Transaction[];
}

interface Customer {
    id: number;
    name: string;
    phone: string;
    email: string | null;
    notes: string | null;
    is_loyal: boolean;
    created_at: string;
}

interface Summary {
    total_motors: number;
    total_invoiced: number;
    total_paid: number;
    total_remaining: number;
}

interface Props {
    customer: Customer;
    motors: Motor[];
    summary: Summary;
    printed_at: string;
}

/* ─── helpers ─── */
const f = (n: number) => n.toFixed(2);

const S: Record<string, React.CSSProperties> = {
    page:     { fontFamily: "'IBM Plex Sans Arabic', sans-serif", background: '#fff', color: '#111', minHeight: '100vh', direction: 'rtl' },
    toolbar:  { position: 'sticky' as const, top: 0, zIndex: 10, display: 'flex', gap: 10, alignItems: 'center', padding: '10px 24px', background: '#18181b', borderBottom: '1px solid #3f3f46' },
    doc:      { maxWidth: 860, margin: '0 auto', padding: '36px 44px' },
    mono:     { fontFamily: "'IBM Plex Mono', 'Courier New', monospace" },
};

export default function CustomerStatement({ customer, motors, summary, printed_at }: Props) {
    useEffect(() => { document.title = `كشف حساب — ${customer.name}`; }, []);

    const fullyPaid = summary.total_remaining <= 0.009;
    const printedDate = new Date(printed_at).toLocaleDateString('ar-EG', {
        year: 'numeric', month: 'long', day: 'numeric',
    });

    return (
        <div style={S.page}>

            {/* ── Toolbar ── */}
            <div className="no-print" style={S.toolbar}>
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
                <span style={{ fontSize: 12, color: '#71717a', marginRight: 4 }}>
                    {summary.total_motors} قيد استلام · طُبع {printed_at}
                </span>
            </div>

            <div style={S.doc}>

                {/* ── Header ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, paddingBottom: 20, borderBottom: '3px solid #111' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, letterSpacing: 0.3 }}>ورشة كريستين</h1>
                        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#71717a' }}>كشف الحساب المالي الشامل للعميل</p>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                        <p style={{ margin: 0, fontSize: 11, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>تاريخ الإصدار</p>
                        <p style={{ margin: '3px 0 0', fontSize: 13, fontWeight: 700 }}>{printedDate}</p>
                    </div>
                </div>

                {/* ── Customer info ── */}
                <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                    <div style={{ flex: 1, border: '1px solid #e4e4e7', borderRadius: 12, overflow: 'hidden' }}>
                        <div style={{ background: '#18181b', color: '#fff', padding: '8px 16px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            بيانات العميل
                        </div>
                        <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', fontSize: 13 }}>
                            <InfoRow label="الاسم"      value={customer.name} />
                            <InfoRow label="الهاتف"     value={customer.phone} ltr />
                            {customer.email && <InfoRow label="البريد" value={customer.email} ltr />}
                            <InfoRow label="عميل منذ"  value={customer.created_at} ltr />
                            {customer.is_loyal && (
                                <div style={{ gridColumn: '1/-1' }}>
                                    <span style={{ display: 'inline-block', background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
                                        ⭐ عميل دائم
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Summary boxes */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, flex: 1 }}>
                        <SumBox label="عدد القيود"      value={String(summary.total_motors)} color="#111" bg="#f4f4f5" border="#e4e4e7" />
                        <SumBox label="إجمالي الفواتير" value={`$${f(summary.total_invoiced)}`} color="#111" bg="#f4f4f5" border="#e4e4e7" mono />
                        <SumBox label="إجمالي المدفوع"  value={`$${f(summary.total_paid)}`}     color="#16a34a" bg="#f0fdf4" border="#bbf7d0" mono />
                        <SumBox
                            label="المتبقي"
                            value={fullyPaid ? '✓ مسدد بالكامل' : `$${f(summary.total_remaining)}`}
                            color={fullyPaid ? '#16a34a' : '#dc2626'}
                            bg={fullyPaid ? '#f0fdf4' : '#fff1f2'}
                            border={fullyPaid ? '#bbf7d0' : '#fecaca'}
                            mono={!fullyPaid}
                        />
                    </div>
                </div>

                {/* ── Motors ── */}
                {motors.map((motor, mi) => {
                    const motorPaid   = motor.total_paid;
                    const motorRem    = motor.remaining;
                    const isSettled   = motorRem <= 0.009;
                    const orderTotal  = motor.maintenance_orders.reduce((s, o) => s + o.labor_cost + o.parts.reduce((sp, p) => sp + p.total_cost, 0), 0);

                    return (
                        <div key={motor.id} style={{ marginBottom: 28, border: '1px solid #e4e4e7', borderRadius: 12, overflow: 'hidden', pageBreakInside: 'avoid' }}>

                            {/* Motor header */}
                            <div style={{ background: '#18181b', color: '#fff', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <span style={{ fontSize: 11, color: '#a1a1aa', fontWeight: 600 }}>#{mi + 1}</span>
                                    <span style={{ ...S.mono, fontSize: 18, fontWeight: 900, letterSpacing: 2 }}>{motor.reference_number}</span>
                                    <span style={{ background: '#3f3f46', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>{motor.status_label}</span>
                                </div>
                                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#d4d4d8' }}>
                                    {motor.received_at  && <span>استلام: {motor.received_at}</span>}
                                    {motor.delivered_at && <span>تسليم: {motor.delivered_at}</span>}
                                </div>
                            </div>

                            <div style={{ padding: '14px 16px' }}>
                                {motor.category_name && (
                                    <p style={{ margin: '0 0 10px', fontSize: 12, color: '#71717a' }}>التصنيف: <strong>{motor.category_name}</strong></p>
                                )}

                                {/* Maintenance orders */}
                                {motor.maintenance_orders.map((order) => {
                                    const orderLaborParts = order.labor_cost + order.parts.reduce((s, p) => s + p.total_cost, 0);
                                    const companyParts    = order.parts.filter(p => p.purchased_by === 'company');
                                    const customerParts   = order.parts.filter(p => p.purchased_by === 'customer');

                                    return (
                                        <div key={order.stage} style={{ marginBottom: 14, border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden' }}>
                                            <div style={{ background: '#fafafa', padding: '7px 12px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0' }}>
                                                <span style={{ fontWeight: 800, fontSize: 13 }}>
                                                    مرحلة {order.stage} — {order.description}
                                                </span>
                                                <span style={{ fontSize: 12, color: '#71717a' }}>
                                                    {order.started_at && `${order.started_at}`}
                                                    {order.completed_at && ` ← ${order.completed_at}`}
                                                </span>
                                            </div>
                                            <div style={{ padding: '8px 12px' }}>

                                                {/* Labor */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: companyParts.length ? 8 : 0 }}>
                                                    <span style={{ color: '#555' }}>أجر العمالة</span>
                                                    <span style={{ ...S.mono, fontWeight: 700 }}>${f(order.labor_cost)}</span>
                                                </div>

                                                {/* Company parts */}
                                                {companyParts.length > 0 && (
                                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginTop: 6 }}>
                                                        <thead>
                                                            <tr style={{ background: '#f4f4f5' }}>
                                                                <Th>القطعة</Th>
                                                                <Th>النوع</Th>
                                                                <Th>المورد</Th>
                                                                <Th align="center">الكمية</Th>
                                                                <Th align="center">سعر البيع</Th>
                                                                <Th align="center">الإجمالي</Th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {companyParts.map((p, pi) => (
                                                                <tr key={pi} style={{ borderTop: '1px solid #f0f0f0' }}>
                                                                    <Td>{p.part_name}</Td>
                                                                    <Td>{p.type_label}</Td>
                                                                    <Td>{p.supplier_name ?? '—'}</Td>
                                                                    <Td align="center">{p.quantity}</Td>
                                                                    <Td align="center" mono>${f(p.unit_price)}</Td>
                                                                    <Td align="center" mono bold>${f(p.total_cost)}</Td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                )}

                                                {/* Customer-supplied parts note */}
                                                {customerParts.length > 0 && (
                                                    <p style={{ margin: '8px 0 0', fontSize: 11, color: '#71717a', fontStyle: 'italic' }}>
                                                        * {customerParts.length} قطعة يجلبها العميل: {customerParts.map(p => p.part_name).join('، ')}
                                                    </p>
                                                )}

                                                {/* Order subtotal */}
                                                <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px dashed #e4e4e7', display: 'flex', justifyContent: 'flex-end', gap: 16, fontSize: 13 }}>
                                                    <span style={{ color: '#777' }}>إجمالي المرحلة</span>
                                                    <span style={{ ...S.mono, fontWeight: 800 }}>${f(orderLaborParts)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Transactions */}
                                {motor.transactions.length > 0 && (
                                    <div style={{ marginTop: 12 }}>
                                        <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.07em' }}>سجل الدفعات</p>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                            <thead>
                                                <tr style={{ background: '#f4f4f5' }}>
                                                    <Th>التاريخ</Th>
                                                    <Th>النوع</Th>
                                                    <Th>ملاحظة</Th>
                                                    <Th align="center">المبلغ</Th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {motor.transactions.map((t, ti) => (
                                                    <tr key={ti} style={{ borderTop: '1px solid #f0f0f0' }}>
                                                        <Td ltr>{t.transaction_date}</Td>
                                                        <Td>{t.type_label}</Td>
                                                        <Td>{t.notes ?? '—'}</Td>
                                                        <Td align="center" mono bold green>${f(t.amount)}</Td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Motor financial summary */}
                                <div style={{ marginTop: 14, background: isSettled ? '#f0fdf4' : '#fafafa', border: `1px solid ${isSettled ? '#bbf7d0' : '#e4e4e7'}`, borderRadius: 8, padding: '10px 14px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap', fontSize: 13 }}>
                                        <FinRow label="إجمالي الفاتورة" value={`$${f(motor.grand_total)}`} bold />
                                        <FinRow label="المدفوع"         value={`$${f(motorPaid)}`}        color="#16a34a" />
                                        <FinRow
                                            label="المتبقي"
                                            value={isSettled ? '✓ مسدد' : `$${f(motorRem)}`}
                                            color={isSettled ? '#16a34a' : '#dc2626'}
                                            bold
                                        />
                                    </div>
                                </div>

                                {motor.notes && (
                                    <p style={{ margin: '8px 0 0', fontSize: 12, color: '#71717a', fontStyle: 'italic' }}>
                                        ملاحظة: {motor.notes}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* ── Grand total ── */}
                <div style={{ border: '2px solid #111', borderRadius: 12, overflow: 'hidden', marginTop: 8 }}>
                    <div style={{ background: '#18181b', color: '#fff', padding: '10px 18px', fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        الملخص الإجمالي
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0 }}>
                        {[
                            { label: 'عدد القيود',      value: String(summary.total_motors),       color: '#111',    bg: '#fff'     },
                            { label: 'إجمالي الفواتير', value: `$${f(summary.total_invoiced)}`,    color: '#111',    bg: '#f9f9f9'  },
                            { label: 'إجمالي المدفوع',  value: `$${f(summary.total_paid)}`,        color: '#16a34a', bg: '#f0fdf4'  },
                            {
                                label: 'المتبقي',
                                value: fullyPaid ? '✓ مسدد بالكامل' : `$${f(summary.total_remaining)}`,
                                color: fullyPaid ? '#16a34a' : '#dc2626',
                                bg:    fullyPaid ? '#f0fdf4' : '#fff1f2',
                            },
                        ].map((item, i) => (
                            <div key={i} style={{ padding: '16px 18px', borderRight: i < 3 ? '1px solid #e4e4e7' : 'none', background: item.bg }}>
                                <p style={{ margin: 0, fontSize: 11, color: '#71717a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{item.label}</p>
                                <p style={{ ...S.mono, margin: '5px 0 0', fontSize: 16, fontWeight: 900, color: item.color }}>{item.value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Footer ── */}
                <div style={{ marginTop: 32, paddingTop: 14, borderTop: '1px solid #e4e4e7', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#a1a1aa' }}>
                    <span>ورشة كريستين — كشف حساب موثّق</span>
                    <span>طُبع بتاريخ: {printedDate}</span>
                </div>
            </div>
        </div>
    );
}

/* ─── helper components ─── */

function InfoRow({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
    return (
        <div>
            <span style={{ color: '#71717a', fontSize: 11 }}>{label}: </span>
            <span style={{ fontWeight: 700, direction: ltr ? 'ltr' : undefined, unicodeBidi: ltr ? 'embed' : undefined }}>{value}</span>
        </div>
    );
}

function SumBox({ label, value, color, bg, border, mono }: {
    label: string; value: string; color: string; bg: string; border: string; mono?: boolean;
}) {
    return (
        <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: '10px 14px' }}>
            <p style={{ margin: 0, fontSize: 10, color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</p>
            <p style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 900, color, ...(mono ? { fontFamily: "'IBM Plex Mono', monospace" } : {}) }}>{value}</p>
        </div>
    );
}

function FinRow({ label, value, color, bold }: { label: string; value: string; color?: string; bold?: boolean }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#555' }}>{label}:</span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: bold ? 800 : 600, fontSize: bold ? 14 : 13, color: color ?? '#111' }}>{value}</span>
        </div>
    );
}

function Th({ children, align }: { children: React.ReactNode; align?: string }) {
    return (
        <th style={{ padding: '6px 10px', textAlign: (align ?? 'right') as any, fontWeight: 700, borderBottom: '1px solid #e4e4e7', color: '#555', fontSize: 11 }}>
            {children}
        </th>
    );
}

function Td({ children, align, mono, bold, green, ltr }: {
    children: React.ReactNode; align?: string; mono?: boolean; bold?: boolean; green?: boolean; ltr?: boolean;
}) {
    return (
        <td style={{
            padding: '5px 10px',
            textAlign: (align ?? 'right') as any,
            color: green ? '#16a34a' : '#333',
            fontWeight: bold ? 700 : 400,
            direction: ltr ? 'ltr' : undefined,
            ...(mono ? { fontFamily: "'IBM Plex Mono', monospace" } : {}),
        }}>
            {children}
        </td>
    );
}
