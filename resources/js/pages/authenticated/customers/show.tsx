import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { ThemeSwitch } from '@/components/theme-switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from '@inertiajs/react';
import { ArrowRight, FileText, Phone, Star, User } from 'lucide-react';

interface Motor {
    id: number;
    reference_number: string;
    status: string;
    status_label: string;
    received_at: string | null;
    delivered_at: string | null;
    total_labor: number;
    total_parts: number;
    grand_total: number;
    total_paid: number;
    remaining: number;
}

interface Customer {
    id: number;
    name: string;
    phone: string;
    email: string | null;
    notes: string | null;
    motors_count: number;
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
}

const statusColors: Record<string, string> = {
    in_workshop: 'bg-blue-100 text-blue-800 border-blue-200',
    in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    ready:       'bg-green-100 text-green-800 border-green-200',
    delivered:   'bg-gray-100 text-gray-700 border-gray-200',
};

function fmt(n: number) {
    return n.toFixed(2);
}

export default function CustomerShow({ customer, motors, summary }: Props) {
    return (
        <>
            <Header fixed>
                <div className="flex flex-1 items-center gap-3">
                    <Link href="/customers">
                        <Button variant="ghost" size="sm" className="gap-1">
                            <ArrowRight className="h-4 w-4" />
                            العملاء
                        </Button>
                    </Link>
                    <span className="text-muted-foreground">/</span>
                    <span className="font-semibold">{customer.name}</span>
                    {customer.is_loyal && (
                        <Badge className="gap-1 bg-amber-100 text-amber-800 border-amber-300">
                            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                            عميل دائم
                        </Badge>
                    )}
                </div>
                <div className="ms-auto flex items-center gap-3">
                    <a href={`/customers/${customer.id}/statement`} target="_blank" rel="noreferrer">
                        <Button variant="outline" size="sm" className="gap-2">
                            <FileText className="h-4 w-4" />
                            كشف حساب PDF
                        </Button>
                    </a>
                    <ThemeSwitch />
                    <ProfileDropdown />
                </div>
            </Header>

            <Main className="flex flex-1 flex-col gap-6">
                {/* Customer info */}
                <div className="flex flex-wrap items-start gap-4">
                    <div className="flex items-center gap-3 rounded-xl border bg-card px-5 py-4 shadow-sm">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <User className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="text-xl font-bold">{customer.name}</p>
                                {customer.is_loyal && (
                                    <Badge className="gap-1 bg-amber-100 text-amber-800 border-amber-300 text-xs">
                                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                        دائم
                                    </Badge>
                                )}
                            </div>
                            <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground" dir="ltr">
                                <Phone className="h-3.5 w-3.5" />
                                {customer.phone}
                            </p>
                            {customer.email && (
                                <p className="text-sm text-muted-foreground">{customer.email}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Summary cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-muted-foreground">عدد قيود الاستلام</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-right">{summary.total_motors}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-muted-foreground">إجمالي الفواتير</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-right">{fmt(summary.total_invoiced)}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-green-700 dark:text-green-400">إجمالي المدفوع</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-right text-green-700 dark:text-green-400">{fmt(summary.total_paid)}</p>
                        </CardContent>
                    </Card>
                    <Card className={summary.total_remaining > 0.009
                        ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30'
                        : 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30'}>
                        <CardHeader className="pb-2">
                            <CardTitle className={`text-sm ${summary.total_remaining > 0.009 ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'}`}>
                                المتبقي
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className={`text-2xl font-bold text-right ${summary.total_remaining > 0.009 ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'}`}>
                                {summary.total_remaining > 0.009 ? fmt(summary.total_remaining) : '✓ مسدد'}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Motors table */}
                <Card>
                    <CardHeader>
                        <CardTitle>سجل قيود الاستلام</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {motors.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground">
                                لا توجد قيود استلام لهذا العميل
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-right">الرقم المرجعي</TableHead>
                                        <TableHead className="text-right">الحالة</TableHead>
                                        <TableHead className="text-right">تاريخ الاستلام</TableHead>
                                        <TableHead className="text-right">إجمالي الفاتورة</TableHead>
                                        <TableHead className="text-right">المدفوع</TableHead>
                                        <TableHead className="text-right">المتبقي</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {motors.map((motor) => (
                                        <TableRow key={motor.id}>
                                            <TableCell>
                                                <Link
                                                    href={`/motors/${motor.id}`}
                                                    className="font-mono font-semibold text-primary hover:underline underline-offset-4"
                                                >
                                                    {motor.reference_number}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={`min-w-[90px] justify-center ${statusColors[motor.status] ?? ''}`}
                                                >
                                                    {motor.status_label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell dir="ltr" className="text-right">{motor.received_at ?? '—'}</TableCell>
                                            <TableCell dir="ltr" className="text-right font-semibold">{fmt(motor.grand_total)}</TableCell>
                                            <TableCell dir="ltr" className="text-right text-green-700 dark:text-green-400 font-semibold">
                                                {fmt(motor.total_paid)}
                                            </TableCell>
                                            <TableCell dir="ltr" className="text-right">
                                                {motor.remaining > 0.009 ? (
                                                    <span className="font-bold text-red-600 dark:text-red-400">{fmt(motor.remaining)}</span>
                                                ) : (
                                                    <span className="font-semibold text-green-600 dark:text-green-400">✓ مسدد</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Link href={`/motors/${motor.id}`}>
                                                    <Button variant="ghost" size="sm">عرض</Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {customer.notes && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">ملاحظات</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">{customer.notes}</p>
                        </CardContent>
                    </Card>
                )}
            </Main>
        </>
    );
}
