import { useEffect } from 'react';

interface Entry {
    id: number;
    type: 'income' | 'expense' | 'deposit';
    type_label: string;
    amount: number;
    description: string;
    entry_date: string;
    notes: string | null;
}

interface Summary {
    balance: number;
    total_income: number;
    total_expense: number;
    total_deposit: number;
}

interface Props {
    entries: Entry[];
    summary: Summary;
    filters: { from?: string; to?: string; type?: string };
}

const TYPE_COLOR: Record<string, string> = {
    income: '#16a34a',
    expense: '#dc2626',
    deposit: '#0284c7',
};

const TYPE_BG: Record<string, string> = {
    income: '#f0fdf4',
    expense: '#fff1f2',
    deposit: '#f0f9ff',
};

export default function AccountingPrint({ entries, summary, filters }: Props) {
    useEffect(() => {
        const range = filters.from && filters.to ? ` (${filters.from} — ${filters.to})` : '';
        document.title = `كشف حساب${range}`;
    }, []);

    const isPositive = summary.balance >= 0;
    const printedAt = new Date().toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const periodLabel =
        filters.from && filters.to
            ? `${filters.from} — ${filters.to}`
            : filters.from
              ? `من ${filters.from}`
              : filters.to
                ? `حتى ${filters.to}`
                : 'جميع الفترات';

    const typeLabel: Record<string, string> = {
        income: 'الدخل فقط',
        expense: 'المصاريف فقط',
        deposit: 'الإيداعات فقط',
    };

    // Running balance per row
    const rowsWithRunning = entries.reduce<Array<{ entry: (typeof entries)[number]; running: number }>>((acc, entry) => {
        const prev = acc.length ? acc[acc.length - 1].running : 0;
        acc.push({ entry, running: prev + (entry.type === 'expense' ? -entry.amount : entry.amount) });
        return acc;
    }, []);

    return (
        <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", background: '#fff', color: '#111', minHeight: '100vh' }}>
            {/* ── Toolbar (no-print) ── */}
            <div
                className="no-print"
                style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    padding: '10px 24px',
                    background: '#18181b',
                    borderBottom: '1px solid #3f3f46',
                    display: 'flex',
                    gap: 10,
                    alignItems: 'center',
                }}
            >
                <button
                    onClick={() => window.print()}
                    style={{
                        background: '#fff',
                        color: '#18181b',
                        border: 'none',
                        borderRadius: 8,
                        padding: '8px 22px',
                        fontSize: 14,
                        fontFamily: 'inherit',
                        cursor: 'pointer',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                    }}
                >
                    🖨 طباعة
                </button>
                <button
                    onClick={() => window.history.back()}
                    style={{
                        background: 'transparent',
                        color: '#a1a1aa',
                        border: '1px solid #3f3f46',
                        borderRadius: 8,
                        padding: '8px 18px',
                        fontSize: 14,
                        fontFamily: 'inherit',
                        cursor: 'pointer',
                    }}
                >
                    ← رجوع
                </button>
                <span style={{ fontSize: 12, color: '#71717a', marginRight: 4 }}>
                    {entries.length} قيد · {periodLabel}
                </span>
            </div>

            {/* ── Document ── */}
            <div style={{ maxWidth: 820, margin: '0 auto', padding: '36px 44px' }}>
                {/* Header */}
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
                            <p style={{ margin: 0, fontSize: 13, color: '#71717a' }}>كشف حساب — المحاسبة والخزنة</p>
                            <p style={{ margin: '6px 0 0', fontSize: 11, color: '#71717a' }}>
                                رقم مالي: ٩٥٠٠١٧ &nbsp;|&nbsp; هاتف: ٧٦١٦٩٠٠٨ &nbsp;|&nbsp; info@ghassan-mitri.com
                            </p>
                        </div>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                        <p style={{ margin: 0, fontSize: 12, color: '#71717a' }}>تاريخ الإصدار</p>
                        <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 700 }}>{printedAt}</p>
                    </div>
                </div>

                {/* Period + filter info */}
                <div
                    style={{
                        display: 'flex',
                        gap: 12,
                        marginBottom: 24,
                        padding: '12px 16px',
                        background: '#f4f4f5',
                        borderRadius: 10,
                        border: '1px solid #e4e4e7',
                    }}
                >
                    <InfoChip label="الفترة الزمنية" value={periodLabel} />
                    {filters.type && <InfoChip label="نوع القيود" value={typeLabel[filters.type] ?? filters.type} />}
                    <InfoChip label="عدد القيود" value={String(entries.length)} />
                </div>

                {/* Summary cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
                    <SummaryCard
                        label="رصيد الخزنة"
                        value={`$${Math.abs(summary.balance).toFixed(2)}`}
                        sub={isPositive ? 'رصيد إيجابي' : 'رصيد سالب'}
                        color={isPositive ? '#16a34a' : '#dc2626'}
                        bg={isPositive ? '#f0fdf4' : '#fff1f2'}
                        border={isPositive ? '#bbf7d0' : '#fecaca'}
                        prefix={isPositive ? '' : '−'}
                        bold
                    />
                    <SummaryCard label="إجمالي الدخل" value={`$${summary.total_income.toFixed(2)}`} color="#16a34a" bg="#f0fdf4" border="#bbf7d0" />
                    <SummaryCard
                        label="إجمالي الإيداعات"
                        value={`$${summary.total_deposit.toFixed(2)}`}
                        color="#0284c7"
                        bg="#f0f9ff"
                        border="#bae6fd"
                    />
                    <SummaryCard
                        label="إجمالي المصاريف"
                        value={`$${summary.total_expense.toFixed(2)}`}
                        color="#dc2626"
                        bg="#fff1f2"
                        border="#fecaca"
                    />
                </div>

                {/* Transactions table */}
                <h2 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 10px', paddingBottom: 7, borderBottom: '1px solid #e4e4e7' }}>
                    تفاصيل الحركات المالية
                </h2>

                {entries.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#a1a1aa', padding: '32px 0', fontSize: 14 }}>لا توجد قيود في هذه الفترة</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                        <thead>
                            <tr style={{ background: '#18181b', color: '#fff' }}>
                                <Th>التاريخ</Th>
                                <Th>النوع</Th>
                                <Th>البيان</Th>
                                <Th align="center">الدخل / الإيداع</Th>
                                <Th align="center">المصروف</Th>
                                <Th align="center">الرصيد</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {rowsWithRunning.map(({ entry, running }, i) => {
                                const isExpense = entry.type === 'expense';
                                const runningPos = running >= 0;

                                return (
                                    <tr key={entry.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                                        <Td ltr>{entry.entry_date}</Td>
                                        <Td>
                                            <span
                                                style={{
                                                    display: 'inline-block',
                                                    padding: '2px 8px',
                                                    borderRadius: 20,
                                                    fontSize: 11,
                                                    fontWeight: 700,
                                                    background: TYPE_BG[entry.type],
                                                    color: TYPE_COLOR[entry.type],
                                                }}
                                            >
                                                {entry.type_label}
                                            </span>
                                        </Td>
                                        <Td>
                                            <div style={{ fontWeight: 600 }}>{entry.description}</div>
                                            {entry.notes && <div style={{ fontSize: 11, color: '#71717a', marginTop: 1 }}>{entry.notes}</div>}
                                        </Td>
                                        <Td align="center">
                                            {!isExpense && (
                                                <span
                                                    style={{ color: TYPE_COLOR[entry.type], fontWeight: 700, fontFamily: 'IBM Plex Mono, monospace' }}
                                                >
                                                    +${entry.amount.toFixed(2)}
                                                </span>
                                            )}
                                        </Td>
                                        <Td align="center">
                                            {isExpense && (
                                                <span style={{ color: '#dc2626', fontWeight: 700, fontFamily: 'IBM Plex Mono, monospace' }}>
                                                    −${entry.amount.toFixed(2)}
                                                </span>
                                            )}
                                        </Td>
                                        <Td align="center">
                                            <span
                                                style={{
                                                    fontWeight: 800,
                                                    fontFamily: 'IBM Plex Mono, monospace',
                                                    color: runningPos ? '#16a34a' : '#dc2626',
                                                }}
                                            >
                                                {runningPos ? '' : '−'}${Math.abs(running).toFixed(2)}
                                            </span>
                                        </Td>
                                    </tr>
                                );
                            })}
                        </tbody>

                        {/* Totals row */}
                        <tfoot>
                            <tr style={{ background: '#18181b', color: '#fff', fontWeight: 800 }}>
                                <td colSpan={3} style={{ padding: '9px 12px', textAlign: 'right', fontSize: 13 }}>
                                    الإجمالي
                                </td>
                                <td
                                    style={{
                                        padding: '9px 12px',
                                        textAlign: 'center',
                                        fontFamily: 'IBM Plex Mono, monospace',
                                        fontSize: 13,
                                        color: '#86efac',
                                    }}
                                >
                                    +${(summary.total_income + summary.total_deposit).toFixed(2)}
                                </td>
                                <td
                                    style={{
                                        padding: '9px 12px',
                                        textAlign: 'center',
                                        fontFamily: 'IBM Plex Mono, monospace',
                                        fontSize: 13,
                                        color: '#fca5a5',
                                    }}
                                >
                                    −${summary.total_expense.toFixed(2)}
                                </td>
                                <td
                                    style={{
                                        padding: '9px 12px',
                                        textAlign: 'center',
                                        fontFamily: 'IBM Plex Mono, monospace',
                                        fontSize: 13,
                                        color: isPositive ? '#86efac' : '#fca5a5',
                                    }}
                                >
                                    {isPositive ? '' : '−'}${Math.abs(summary.balance).toFixed(2)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                )}

                {/* Footer */}
                <div
                    style={{
                        marginTop: 40,
                        paddingTop: 14,
                        borderTop: '1px solid #e4e4e7',
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 11,
                        color: '#a1a1aa',
                    }}
                >
                    <span>كشف حساب رسمي</span>
                    <span>طُبع بتاريخ: {printedAt}</span>
                </div>
            </div>
        </div>
    );
}

/* ── helpers ── */

function InfoChip({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 10, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>{label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{value}</span>
        </div>
    );
}

function SummaryCard({
    label,
    value,
    sub,
    color,
    bg,
    border,
    bold,
}: {
    label: string;
    value: string;
    sub?: string;
    color: string;
    bg: string;
    border: string;
    prefix?: string;
    bold?: boolean;
}) {
    return (
        <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: '10px 14px' }}>
            <p style={{ margin: 0, fontSize: 10, color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
            <p style={{ margin: '4px 0 0', fontSize: bold ? 18 : 16, fontWeight: 900, color, fontFamily: 'IBM Plex Mono, monospace' }}>{value}</p>
            {sub && <p style={{ margin: '2px 0 0', fontSize: 10, color, opacity: 0.7 }}>{sub}</p>}
        </div>
    );
}

function Th({ children, align }: { children: React.ReactNode; align?: string }) {
    return (
        <th style={{ padding: '8px 12px', textAlign: (align ?? 'right') as React.CSSProperties['textAlign'], fontWeight: 700, fontSize: 12 }}>
            {children}
        </th>
    );
}

function Td({ children, align, ltr }: { children: React.ReactNode; align?: string; ltr?: boolean }) {
    return (
        <td
            style={{
                padding: '7px 12px',
                textAlign: (align ?? 'right') as React.CSSProperties['textAlign'],
                verticalAlign: 'middle',
                direction: ltr ? 'ltr' : undefined,
            }}
        >
            {children}
        </td>
    );
}
