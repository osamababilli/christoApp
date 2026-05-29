import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { ThemeSwitch } from '@/components/theme-switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from '@inertiajs/react';
import { ArrowRight, Package, Phone, Truck } from 'lucide-react';

interface Part {
    id: number;
    part_name: string;
    type: string;
    type_label: string;
    quantity: number;
    unit_cost: number;
    total_cost: number;
    is_paid: boolean;
    motor_id: number | null;
    reference_number: string | null;
    received_at: string | null;
    created_at: string;
}

interface Supplier {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
    notes: string | null;
    created_at: string;
}

interface Summary {
    total_parts: number;
    total_cost: number;
    paid_cost: number;
    unpaid_cost: number;
}

interface Props {
    supplier: Supplier;
    parts: Part[];
    summary: Summary;
}

const typeColors: Record<string, string> = {
    part:      'bg-blue-100 text-blue-800 border-blue-200',
    oil:       'bg-yellow-100 text-yellow-800 border-yellow-200',
    transport: 'bg-purple-100 text-purple-800 border-purple-200',
    cleaning:  'bg-green-100 text-green-800 border-green-200',
    other:     'bg-gray-100 text-gray-700 border-gray-200',
};

function fmt(n: number) {
    return n.toFixed(2);
}

export default function SupplierShow({ supplier, parts, summary }: Props) {
    return (
        <>
            <Header fixed>
                <div className="flex flex-1 items-center gap-3">
                    <Link href="/suppliers">
                        <Button variant="ghost" size="sm" className="gap-1">
                            <ArrowRight className="h-4 w-4" />
                            الموردون
                        </Button>
                    </Link>
                    <span className="text-muted-foreground">/</span>
                    <span className="font-semibold">{supplier.name}</span>
                </div>
                <div className="ms-auto flex items-center gap-3">
                    <ThemeSwitch />
                    <ProfileDropdown />
                </div>
            </Header>

            <Main className="flex flex-1 flex-col gap-6">
                {/* Supplier info */}
                <div className="flex flex-wrap items-start gap-4">
                    <div className="flex items-center gap-3 rounded-xl border bg-card px-5 py-4 shadow-sm">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Truck className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xl font-bold">{supplier.name}</p>
                            {supplier.phone && (
                                <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground" dir="ltr">
                                    <Phone className="h-3.5 w-3.5" />
                                    {supplier.phone}
                                </p>
                            )}
                            {supplier.email && (
                                <p className="text-sm text-muted-foreground">{supplier.email}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Summary cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-muted-foreground">إجمالي القطع المشتراة</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-right">{summary.total_parts}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-muted-foreground">إجمالي التكلفة</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-right">{fmt(summary.total_cost)}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-green-700 dark:text-green-400">المدفوع</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-right text-green-700 dark:text-green-400">
                                {fmt(summary.paid_cost)}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className={summary.unpaid_cost > 0.009
                        ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30'
                        : 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30'}>
                        <CardHeader className="pb-2">
                            <CardTitle className={`text-sm ${summary.unpaid_cost > 0.009 ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'}`}>
                                غير مدفوع
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className={`text-2xl font-bold text-right ${summary.unpaid_cost > 0.009 ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'}`}>
                                {summary.unpaid_cost > 0.009 ? fmt(summary.unpaid_cost) : '✓ مسدد'}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Parts table */}
                <Card>
                    <CardHeader>
                        <CardTitle>القطع المشتراة من هذا المورد</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {parts.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
                                <Package className="h-10 w-10 opacity-30" />
                                <p className="text-lg">لا توجد قطع مشتراة من هذا المورد</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-right">اسم القطعة</TableHead>
                                        <TableHead className="text-right">النوع</TableHead>
                                        <TableHead className="text-right">الكمية</TableHead>
                                        <TableHead className="text-right">سعر الوحدة</TableHead>
                                        <TableHead className="text-right">الإجمالي</TableHead>
                                        <TableHead className="text-right">الحالة</TableHead>
                                        <TableHead className="text-right">رقم القيد</TableHead>
                                        <TableHead className="text-right">تاريخ الاستلام</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {parts.map((part) => (
                                        <TableRow key={part.id}>
                                            <TableCell className="font-semibold">{part.part_name}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={typeColors[part.type] ?? ''}
                                                >
                                                    {part.type_label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell dir="ltr" className="text-right">
                                                {part.quantity % 1 === 0
                                                    ? part.quantity.toFixed(0)
                                                    : part.quantity.toFixed(3)}
                                            </TableCell>
                                            <TableCell dir="ltr" className="text-right">
                                                {fmt(part.unit_cost)}
                                            </TableCell>
                                            <TableCell dir="ltr" className="text-right font-semibold">
                                                {fmt(part.total_cost)}
                                            </TableCell>
                                            <TableCell>
                                                {part.is_paid ? (
                                                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                                                        مدفوع
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                                                        غير مدفوع
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {part.motor_id ? (
                                                    <Link
                                                        href={`/motors/${part.motor_id}`}
                                                        className="font-mono font-semibold text-primary hover:underline underline-offset-4"
                                                    >
                                                        {part.reference_number ?? '—'}
                                                    </Link>
                                                ) : (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell dir="ltr" className="text-right text-sm text-muted-foreground">
                                                {part.received_at ?? part.created_at}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {supplier.notes && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">ملاحظات</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">{supplier.notes}</p>
                        </CardContent>
                    </Card>
                )}
            </Main>
        </>
    );
}
