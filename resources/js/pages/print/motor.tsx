import { useEffect } from 'react';

interface Part {
    part_name: string;
    type_label: string;
    quantity: number;
    unit_cost: number;
    total_cost: number;
    supplier_name: string | null;
}

interface MaintenanceOrder {
    id: number;
    stage: number;
    description: string;
    started_at: string | null;
    completed_at: string | null;
    labor_cost: number;
    status_label: string;
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
    customer: { name: string; phone: string };
    brand: string | null;
    model: string | null;
    status_label: string;
    condition_label: string | null;
    notes: string | null;
    received_at: string | null;
    delivered_at: string | null;
    maintenance_orders: MaintenanceOrder[];
    transactions: Transaction[];
}

export default function MotorPrint({ motor }: { motor: Motor }) {
    useEffect(() => {
        document.title = `فاتورة — ${motor.reference_number}`;
    }, []);

    const totalLabor  = motor.maintenance_orders.reduce((s, o) => s + o.labor_cost, 0);
    const totalParts  = motor.maintenance_orders.flatMap((o) => o.parts).reduce((s, p) => s + p.total_cost, 0);
    const grandTotal  = totalLabor + totalParts;
    const totalPaid   = motor.transactions.filter((t) => t.type_label === 'دفعة').reduce((s, t) => s + t.amount, 0);
    const totalDisc   = motor.transactions.filter((t) => t.type_label === 'خصم').reduce((s, t) => s + t.amount, 0);
    const remaining   = grandTotal - totalPaid - totalDisc;

    return (
        <div dir="rtl" style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif", background: '#fff', color: '#111', minHeight: '100vh' }}>

            {/* Print actions — hidden when printing */}
            <div className="no-print" style={{ padding: '12px 24px', background: '#f4f4f5', borderBottom: '1px solid #e4e4e7', display: 'flex', gap: 10, alignItems: 'center' }}>
                <button
                    onClick={() => window.print()}
                    style={{ background: '#111', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 22px', fontSize: 14, fontFamily: 'inherit', cursor: 'pointer', fontWeight: 700 }}
                >
                    🖨 طباعة
                </button>
                <button
                    onClick={() => window.history.back()}
                    style={{ background: '#fff', color: '#333', border: '1px solid #d4d4d8', borderRadius: 8, padding: '8px 18px', fontSize: 14, fontFamily: 'inherit', cursor: 'pointer' }}
                >
                    ← رجوع
                </button>
                <span style={{ fontSize: 13, color: '#71717a', marginRight: 8 }}>
                    ستظهر هذه الأزرار فقط على الشاشة ولن تُطبع
                </span>
            </div>

            {/* Invoice content */}
            <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 40px' }}>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 28, paddingBottom: 20, borderBottom: '2px solid #111' }}>
                    <h1 style={{ fontSize: 26, fontWeight: 900, margin: 0, letterSpacing: 1 }}>ورشة موتورات</h1>
                    <p style={{ fontSize: 13, color: '#555', margin: '4px 0 0' }}>فاتورة / ورقة استلام وتسليم</p>
                </div>

                {/* Reference + dates row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, padding: '14px 18px', background: '#f9f9f9', borderRadius: 8, border: '1px solid #e4e4e7' }}>
                    <div>
                        <p style={{ margin: 0, fontSize: 13, color: '#777' }}>الرقم المرجعي</p>
                        <p style={{ margin: '2px 0 0', fontSize: 22, fontWeight: 900, fontFamily: 'monospace', letterSpacing: 2 }}>{motor.reference_number}</p>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                        {motor.received_at && <p style={{ margin: 0, fontSize: 13, color: '#555' }}>تاريخ الاستلام: <strong>{motor.received_at}</strong></p>}
                        {motor.delivered_at && <p style={{ margin: '4px 0 0', fontSize: 13, color: '#555' }}>تاريخ التسليم: <strong>{motor.delivered_at}</strong></p>}
                        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#555' }}>الحالة: <strong>{motor.status_label}</strong></p>
                    </div>
                </div>

                {/* Customer + Motor details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                    <Section title="بيانات العميل">
                        <Row label="الاسم" value={motor.customer.name} />
                        <Row label="الهاتف" value={motor.customer.phone} ltr />
                    </Section>
                    <Section title="بيانات الموتور">
                        {motor.brand   && <Row label="الماركة" value={motor.brand} />}
                        {motor.model   && <Row label="الموديل" value={motor.model} />}
                        {motor.condition_label && <Row label="الحالة الفنية" value={motor.condition_label} />}
                    </Section>
                </div>

                {motor.notes && (
                    <div style={{ marginBottom: 24, padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8 }}>
                        <p style={{ margin: 0, fontSize: 12, color: '#92400e', fontWeight: 700 }}>ملاحظات</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#78350f' }}>{motor.notes}</p>
                    </div>
                )}

                {/* Maintenance orders */}
                <SectionTitle>أوامر الصيانة</SectionTitle>
                {motor.maintenance_orders.length === 0 ? (
                    <p style={{ color: '#999', fontSize: 13, marginBottom: 24 }}>لا توجد أوامر صيانة</p>
                ) : (
                    motor.maintenance_orders.map((order) => {
                        const orderTotal = order.labor_cost + order.parts.reduce((s, p) => s + p.total_cost, 0);
                        return (
                            <div key={order.id} style={{ marginBottom: 20, border: '1px solid #e4e4e7', borderRadius: 8, overflow: 'hidden' }}>
                                {/* Order header */}
                                <div style={{ background: '#f4f4f5', padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 800, fontSize: 14 }}>مرحلة {order.stage} — {order.status_label}</span>
                                    <span style={{ fontSize: 13, color: '#555' }}>
                                        {order.started_at && `بدأ: ${order.started_at}`}
                                        {order.completed_at && ` | اكتمل: ${order.completed_at}`}
                                    </span>
                                </div>
                                <div style={{ padding: '10px 14px' }}>
                                    <p style={{ margin: '0 0 8px', fontSize: 13 }}>{order.description}</p>
                                    <p style={{ margin: '0 0 8px', fontSize: 13, color: '#555' }}>
                                        أجر العمالة: <strong>{order.labor_cost.toFixed(2)}</strong>
                                    </p>
                                    {order.parts.length > 0 && (
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                            <thead>
                                                <tr style={{ background: '#fafafa' }}>
                                                    <Th>القطعة</Th>
                                                    <Th>النوع</Th>
                                                    <Th>المورد</Th>
                                                    <Th align="center">الكمية</Th>
                                                    <Th align="center">سعر الوحدة</Th>
                                                    <Th align="center">الإجمالي</Th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {order.parts.map((p, i) => (
                                                    <tr key={i} style={{ borderTop: '1px solid #f0f0f0' }}>
                                                        <Td>{p.part_name}</Td>
                                                        <Td>{p.type_label}</Td>
                                                        <Td>{p.supplier_name ?? '—'}</Td>
                                                        <Td align="center">{p.quantity}</Td>
                                                        <Td align="center">{p.unit_cost.toFixed(2)}</Td>
                                                        <Td align="center"><strong>{p.total_cost.toFixed(2)}</strong></Td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                    <p style={{ margin: '8px 0 0', fontSize: 13, fontWeight: 700, textAlign: 'left', color: '#333' }}>
                                        إجمالي الأمر: {orderTotal.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}

                {/* Financial summary */}
                <SectionTitle>الملخص المالي</SectionTitle>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24, fontSize: 14 }}>
                    <tbody>
                        <SummaryRow label="إجمالي العمالة" value={totalLabor.toFixed(2)} />
                        <SummaryRow label="إجمالي القطع والمستلزمات" value={totalParts.toFixed(2)} />
                        <SummaryRow label="إجمالي الفاتورة" value={grandTotal.toFixed(2)} bold border />
                        <SummaryRow label="المدفوع" value={(totalPaid + totalDisc).toFixed(2)} color="#16a34a" />
                        <SummaryRow
                            label="المتبقي"
                            value={remaining <= 0 ? '✓ مسدد بالكامل' : remaining.toFixed(2)}
                            color={remaining <= 0 ? '#16a34a' : '#ea580c'}
                            bold
                        />
                    </tbody>
                </table>

                {/* Payments */}
                {motor.transactions.length > 0 && (
                    <>
                        <SectionTitle>سجل الدفعات</SectionTitle>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 24 }}>
                            <thead>
                                <tr style={{ background: '#f4f4f5' }}>
                                    <Th>التاريخ</Th>
                                    <Th>النوع</Th>
                                    <Th>ملاحظة</Th>
                                    <Th align="center">المبلغ</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {motor.transactions.map((t, i) => (
                                    <tr key={i} style={{ borderTop: '1px solid #f0f0f0' }}>
                                        <Td>{t.transaction_date}</Td>
                                        <Td>{t.type_label}</Td>
                                        <Td>{t.notes ?? '—'}</Td>
                                        <Td align="center"><strong>{t.amount.toFixed(2)}</strong></Td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )}

                {/* Footer */}
                <div style={{ marginTop: 40, paddingTop: 16, borderTop: '1px solid #e4e4e7', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#999' }}>
                    <span>طُبع بتاريخ: {new Date().toLocaleDateString('ar-SA')}</span>
                    <span>{motor.reference_number}</span>
                </div>
            </div>
        </div>
    );
}

/* ── small helper components ── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ border: '1px solid #e4e4e7', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ background: '#f4f4f5', padding: '6px 14px', fontWeight: 800, fontSize: 13 }}>{title}</div>
            <div style={{ padding: '10px 14px', fontSize: 13 }}>{children}</div>
        </div>
    );
}

function Row({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: '#777' }}>{label}:</span>
            <span style={{ fontWeight: 600, direction: ltr ? 'ltr' : undefined }}>{value}</span>
        </div>
    );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 12px', paddingBottom: 6, borderBottom: '1px solid #e4e4e7' }}>
            {children}
        </h3>
    );
}

function Th({ children, align }: { children: React.ReactNode; align?: string }) {
    return (
        <th style={{ padding: '6px 10px', textAlign: (align ?? 'right') as any, fontWeight: 700, borderBottom: '1px solid #e4e4e7', color: '#555' }}>
            {children}
        </th>
    );
}

function Td({ children, align }: { children: React.ReactNode; align?: string }) {
    return (
        <td style={{ padding: '5px 10px', textAlign: (align ?? 'right') as any, color: '#333' }}>
            {children}
        </td>
    );
}

function SummaryRow({ label, value, bold, border, color }: { label: string; value: string; bold?: boolean; border?: boolean; color?: string }) {
    return (
        <tr style={{ borderTop: border ? '2px solid #111' : '1px solid #f0f0f0' }}>
            <td style={{ padding: '7px 10px', color: '#555', fontSize: 14 }}>{label}</td>
            <td style={{ padding: '7px 10px', textAlign: 'left', fontWeight: bold ? 800 : 600, fontSize: bold ? 16 : 14, color: color ?? '#111' }}>
                {value}
            </td>
        </tr>
    );
}
