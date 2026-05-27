import { useEffect } from 'react';

interface MaintenanceSummary {
    stage: number;
    description: string;
    status_label: string;
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
    maintenance_summary: MaintenanceSummary[];
    grand_total: number;
    total_paid: number;
    remaining: number;
}

export default function DeliveryPrint({ motor }: { motor: Motor }) {
    useEffect(() => {
        document.title = `ورقة تسليم — ${motor.reference_number}`;
    }, []);

    return (
        <div dir="rtl" style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif", background: '#fff', color: '#111', minHeight: '100vh' }}>

            {/* Print actions */}
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

            <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 40px' }}>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 28, paddingBottom: 20, borderBottom: '3px double #111' }}>
                    <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, letterSpacing: 1 }}>ورشة موتورات</h1>
                    <p style={{ fontSize: 16, fontWeight: 700, margin: '6px 0 0', color: '#333', letterSpacing: 2 }}>ورقة استلام وتسليم</p>
                    <p style={{ fontSize: 12, color: '#888', margin: '4px 0 0' }}>نسخة العميل</p>
                </div>

                {/* Reference box */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, padding: '14px 20px', background: '#f9f9f9', borderRadius: 10, border: '1px solid #e4e4e7' }}>
                    <div>
                        <p style={{ margin: 0, fontSize: 12, color: '#888' }}>رقم الوثيقة</p>
                        <p style={{ margin: '2px 0 0', fontSize: 24, fontWeight: 900, fontFamily: 'monospace', letterSpacing: 3 }}>{motor.reference_number}</p>
                    </div>
                    <div style={{ textAlign: 'left', fontSize: 13 }}>
                        {motor.received_at && (
                            <p style={{ margin: 0, color: '#555' }}>تاريخ الاستلام: <strong>{motor.received_at}</strong></p>
                        )}
                        {motor.delivered_at && (
                            <p style={{ margin: '4px 0 0', color: '#555' }}>تاريخ التسليم: <strong>{motor.delivered_at}</strong></p>
                        )}
                        <p style={{ margin: '4px 0 0', color: '#555' }}>الحالة: <strong>{motor.status_label}</strong></p>
                    </div>
                </div>

                {/* Customer + Motor */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                    <DeliverySection title="بيانات العميل">
                        <DeliveryRow label="الاسم" value={motor.customer.name} />
                        <DeliveryRow label="الجوال" value={motor.customer.phone} ltr />
                    </DeliverySection>
                    <DeliverySection title="بيانات الموتور">
                        {motor.brand    && <DeliveryRow label="الماركة" value={motor.brand} />}
                        {motor.model    && <DeliveryRow label="الموديل" value={motor.model} />}
                        {motor.condition_label && <DeliveryRow label="الحالة الفنية" value={motor.condition_label} />}
                    </DeliverySection>
                </div>

                {/* Notes */}
                {motor.notes && (
                    <div style={{ marginBottom: 24, padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8 }}>
                        <p style={{ margin: 0, fontSize: 12, color: '#92400e', fontWeight: 700 }}>ملاحظات</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#78350f' }}>{motor.notes}</p>
                    </div>
                )}

                {/* Maintenance summary */}
                {motor.maintenance_summary.length > 0 && (
                    <>
                        <p style={{ fontSize: 14, fontWeight: 800, margin: '0 0 10px', paddingBottom: 6, borderBottom: '1px solid #e4e4e7' }}>
                            ملخص أعمال الصيانة
                        </p>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 24 }}>
                            <thead>
                                <tr style={{ background: '#f4f4f5' }}>
                                    <th style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 700, borderBottom: '1px solid #e4e4e7' }}>المرحلة</th>
                                    <th style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 700, borderBottom: '1px solid #e4e4e7' }}>الوصف</th>
                                    <th style={{ padding: '7px 12px', textAlign: 'center', fontWeight: 700, borderBottom: '1px solid #e4e4e7' }}>الحالة</th>
                                </tr>
                            </thead>
                            <tbody>
                                {motor.maintenance_summary.map((m, i) => (
                                    <tr key={i} style={{ borderTop: '1px solid #f0f0f0' }}>
                                        <td style={{ padding: '6px 12px' }}>مرحلة {m.stage}</td>
                                        <td style={{ padding: '6px 12px' }}>{m.description}</td>
                                        <td style={{ padding: '6px 12px', textAlign: 'center' }}>{m.status_label}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )}

                {/* Financial summary */}
                <p style={{ fontSize: 14, fontWeight: 800, margin: '0 0 10px', paddingBottom: 6, borderBottom: '1px solid #e4e4e7' }}>
                    الملخص المالي
                </p>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, marginBottom: 32 }}>
                    <tbody>
                        <tr style={{ borderTop: '1px solid #f0f0f0' }}>
                            <td style={{ padding: '7px 12px', color: '#555' }}>إجمالي الفاتورة</td>
                            <td style={{ padding: '7px 12px', textAlign: 'left', fontWeight: 700 }}>{motor.grand_total.toFixed(2)}</td>
                        </tr>
                        <tr style={{ borderTop: '1px solid #f0f0f0' }}>
                            <td style={{ padding: '7px 12px', color: '#555' }}>المبلغ المدفوع</td>
                            <td style={{ padding: '7px 12px', textAlign: 'left', fontWeight: 700, color: '#16a34a' }}>{motor.total_paid.toFixed(2)}</td>
                        </tr>
                        <tr style={{ borderTop: '2px solid #111' }}>
                            <td style={{ padding: '9px 12px', fontWeight: 800, fontSize: 15 }}>المبلغ المتبقي</td>
                            <td style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 900, fontSize: 16, color: motor.remaining <= 0.009 ? '#16a34a' : '#ea580c' }}>
                                {motor.remaining <= 0.009 ? '✓ مسدد بالكامل' : motor.remaining.toFixed(2)}
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* Signature section */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginTop: 8 }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ borderBottom: '1px solid #aaa', height: 48, marginBottom: 8 }} />
                        <p style={{ margin: 0, fontSize: 13, color: '#555' }}>توقيع العميل</p>
                        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#888' }}>{motor.customer.name}</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ borderBottom: '1px solid #aaa', height: 48, marginBottom: 8 }} />
                        <p style={{ margin: 0, fontSize: 13, color: '#555' }}>توقيع الفني</p>
                        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#888' }}>ورشة الموتورات</p>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ marginTop: 32, paddingTop: 14, borderTop: '1px solid #e4e4e7', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#aaa' }}>
                    <span>طُبعت بتاريخ: {new Date().toLocaleDateString('ar-SA')}</span>
                    <span>{motor.reference_number}</span>
                </div>
            </div>
        </div>
    );
}

function DeliverySection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ border: '1px solid #e4e4e7', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ background: '#f4f4f5', padding: '7px 14px', fontWeight: 800, fontSize: 13 }}>{title}</div>
            <div style={{ padding: '10px 14px', fontSize: 13 }}>{children}</div>
        </div>
    );
}

function DeliveryRow({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: '#777' }}>{label}:</span>
            <span style={{ fontWeight: 600, direction: ltr ? 'ltr' : undefined }}>{value}</span>
        </div>
    );
}
