import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { ThemeSwitch } from '@/components/theme-switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import {
    BarChart3,
    CheckCircle2,
    ClipboardList,
    Clock,
    DollarSign,
    Package,
    Truck,
    Users,
    Wrench,
} from 'lucide-react';

interface Financial {
    total_labor: number;
    total_parts: number;
    paid_parts: number;
    unpaid_parts: number;
    grand_total: number;
}

interface Totals {
    motors: number;
    customers: number;
    suppliers: number;
    maintenance: number;
    parts: number;
}

interface PartByType {
    type: string;
    label: string;
    count: number;
    total: number;
}

interface RecentMotor {
    id: number;
    reference_number: string;
    customer_name: string;
    status: string;
    status_label: string;
    received_at: string;
}

interface Props {
    financial: Financial;
    motors_by_status: Record<string, number>;
    maintenance_by_status: Record<string, number>;
    parts_by_type: PartByType[];
    recent_motors: RecentMotor[];
    totals: Totals;
}

const motorStatusConfig: Record<string, { label: string; color: string; dot: string }> = {
    in_workshop: { label: 'في الورشة',     color: 'border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300',     dot: 'bg-blue-500'   },
    in_progress: { label: 'قيد الإصلاح',  color: 'border-yellow-200 bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:border-yellow-800 dark:text-yellow-300', dot: 'bg-yellow-500' },
    ready:       { label: 'جاهز للاستلام', color: 'border-green-200 bg-green-50 text-green-700 dark:bg-green-950/40 dark:border-green-800 dark:text-green-300',   dot: 'bg-green-500'  },
    delivered:   { label: 'تم التسليم',    color: 'border-gray-200 bg-gray-50 text-gray-600 dark:bg-gray-800/40 dark:border-gray-700 dark:text-gray-300',         dot: 'bg-gray-400'   },
};

const maintenanceStatusConfig: Record<string, { label: string; color: string; dot: string }> = {
    in_progress: { label: 'قيد التنفيذ', color: 'border-yellow-200 bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:border-yellow-800 dark:text-yellow-300', dot: 'bg-yellow-500' },
    completed:   { label: 'مكتمل',       color: 'border-green-200 bg-green-50 text-green-700 dark:bg-green-950/40 dark:border-green-800 dark:text-green-300',       dot: 'bg-green-500'  },
    on_hold:     { label: 'موقوف',        color: 'border-red-200 bg-red-50 text-red-700 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300',                   dot: 'bg-red-500'    },
};

const typeColors: Record<string, string> = {
    part:      'bg-blue-100 text-blue-700 border-blue-200',
    oil:       'bg-amber-100 text-amber-700 border-amber-200',
    transport: 'bg-purple-100 text-purple-700 border-purple-200',
    cleaning:  'bg-cyan-100 text-cyan-700 border-cyan-200',
    other:     'bg-gray-100 text-gray-600 border-gray-200',
};

function StatCard({ icon: Icon, label, value, sub, color }: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    sub?: string;
    color: string;
}) {
    return (
        <Card>
            <CardContent className="flex items-center gap-4 p-5">
                <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', color)}>
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    {sub && <p className="text-xs text-muted-foreground/70">{sub}</p>}
                </div>
            </CardContent>
        </Card>
    );
}

function StatusBreakdown({ title, data, config }: {
    title: string;
    data: Record<string, number>;
    config: Record<string, { label: string; color: string; dot: string }>;
}) {
    const total = Object.values(data).reduce((s, n) => s + n, 0);
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {total === 0 ? (
                    <p className="text-sm text-muted-foreground">لا توجد بيانات</p>
                ) : (
                    Object.entries(config).map(([key, cfg]) => {
                        const count = data[key] ?? 0;
                        const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
                        return (
                            <div key={key} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-1.5">
                                        <span className={cn('inline-block h-2 w-2 rounded-full', cfg.dot)} />
                                        {cfg.label}
                                    </span>
                                    <span className="font-semibold">{count}</span>
                                </div>
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                    <div
                                        className={cn('h-full rounded-full transition-all', cfg.dot)}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })
                )}
            </CardContent>
        </Card>
    );
}

export function Reports({ financial, motors_by_status, maintenance_by_status, parts_by_type, recent_motors, totals }: Props) {
    const partsGrandTotal = parts_by_type.reduce((s, p) => s + p.total, 0);

    return (
        <>
            <Header>
                <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-muted-foreground" />
                    <h1 className="text-lg font-semibold">التقارير والإحصائيات</h1>
                </div>
                <div className="ms-auto flex items-center gap-3">
                    <ThemeSwitch />
                    <ProfileDropdown />
                </div>
            </Header>

            <Main className="flex flex-col gap-6 pb-10">

                {/* ── Overview counts ── */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <StatCard icon={Wrench}        label="الموتورات"    value={totals.motors}      color="bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300" />
                    <StatCard icon={Users}          label="العملاء"      value={totals.customers}   color="bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300" />
                    <StatCard icon={Truck}          label="الموردون"     value={totals.suppliers}   color="bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300" />
                    <StatCard icon={ClipboardList}  label="أوامر الصيانة" value={totals.maintenance} color="bg-yellow-100 text-yellow-700 dark:bg-yellow-950/60 dark:text-yellow-300" />
                    <StatCard icon={Package}        label="القطع"        value={totals.parts}       color="bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300" />
                </div>

                {/* ── Financial summary ── */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-muted-foreground" />
                            الملخص المالي
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                            <div className="rounded-xl border-2 border-primary/20 bg-primary/5 px-5 py-4 lg:col-span-1">
                                <p className="text-xs text-muted-foreground">الإجمالي الكلي</p>
                                <p className="mt-1 text-2xl font-bold text-primary">{financial.grand_total.toFixed(2)}</p>
                            </div>
                            <div className="rounded-xl border bg-muted/40 px-5 py-4">
                                <p className="text-xs text-muted-foreground">تكلفة العمالة</p>
                                <p className="mt-1 text-xl font-semibold">{financial.total_labor.toFixed(2)}</p>
                            </div>
                            <div className="rounded-xl border bg-muted/40 px-5 py-4">
                                <p className="text-xs text-muted-foreground">تكلفة القطع (إجمالي)</p>
                                <p className="mt-1 text-xl font-semibold">{financial.total_parts.toFixed(2)}</p>
                            </div>
                            <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-4 dark:border-green-900 dark:bg-green-950/30">
                                <p className="flex items-center gap-1 text-xs text-green-700 dark:text-green-400">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> مدفوع
                                </p>
                                <p className="mt-1 text-xl font-semibold text-green-700 dark:text-green-400">{financial.paid_parts.toFixed(2)}</p>
                            </div>
                            <div className="rounded-xl border border-orange-200 bg-orange-50 px-5 py-4 dark:border-orange-900 dark:bg-orange-950/30">
                                <p className="flex items-center gap-1 text-xs text-orange-700 dark:text-orange-400">
                                    <Clock className="h-3.5 w-3.5" /> غير مدفوع
                                </p>
                                <p className="mt-1 text-xl font-semibold text-orange-700 dark:text-orange-400">{financial.unpaid_parts.toFixed(2)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* ── Status breakdowns ── */}
                <div className="grid gap-6 lg:grid-cols-2">
                    <StatusBreakdown
                        title="الموتورات حسب الحالة"
                        data={motors_by_status}
                        config={motorStatusConfig}
                    />
                    <StatusBreakdown
                        title="أوامر الصيانة حسب الحالة"
                        data={maintenance_by_status}
                        config={maintenanceStatusConfig}
                    />
                </div>

                {/* ── Parts by type + Recent motors ── */}
                <div className="grid gap-6 lg:grid-cols-2">

                    {/* Parts by type */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                القطع حسب النوع
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {parts_by_type.length === 0 ? (
                                <p className="text-sm text-muted-foreground">لا توجد قطع مسجلة</p>
                            ) : (
                                <div className="space-y-2">
                                    {parts_by_type.map((p) => (
                                        <div key={p.type} className="flex items-center justify-between rounded-lg border px-3 py-2">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className={cn('text-xs', typeColors[p.type] ?? '')}>
                                                    {p.label}
                                                </Badge>
                                                <span className="text-sm text-muted-foreground">{p.count} قطعة</span>
                                            </div>
                                            <span className="font-semibold text-sm">{p.total.toFixed(2)}</span>
                                        </div>
                                    ))}
                                    <Separator />
                                    <div className="flex items-center justify-between px-3 py-1">
                                        <span className="text-sm font-medium">الإجمالي</span>
                                        <span className="font-bold text-primary">{partsGrandTotal.toFixed(2)}</span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent motors */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Wrench className="h-4 w-4 text-muted-foreground" />
                                آخر الموتورات المضافة
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {recent_motors.length === 0 ? (
                                <p className="px-6 py-4 text-sm text-muted-foreground">لا توجد موتورات</p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-right">الرقم المرجعي</TableHead>
                                            <TableHead className="text-right">العميل</TableHead>
                                            <TableHead className="text-right">الحالة</TableHead>
                                            <TableHead className="text-right">تاريخ الاستلام</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recent_motors.map((m) => {
                                            const cfg = motorStatusConfig[m.status] ?? motorStatusConfig.in_workshop;
                                            return (
                                                <TableRow key={m.id}>
                                                    <TableCell>
                                                        <Link
                                                            href={`/motors/${m.id}`}
                                                            className="font-mono text-sm font-semibold text-primary hover:underline underline-offset-4"
                                                        >
                                                            {m.reference_number}
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell className="text-sm">{m.customer_name}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className={cn('text-xs', cfg.color)}>
                                                            <span className={cn('me-1 inline-block h-1.5 w-1.5 rounded-full', cfg.dot)} />
                                                            {cfg.label}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">{m.received_at}</TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </Main>
        </>
    );
}
