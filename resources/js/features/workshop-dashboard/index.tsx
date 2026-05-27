import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { ThemeSwitch } from '@/components/theme-switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from '@inertiajs/react';
import { AlertCircle, CheckCircle2, Clock, DollarSign, Plus, Wrench } from 'lucide-react';

interface Motor {
    id: number;
    reference_number: string;
    customer_id: number;
    customer_name: string;
    customer_phone: string;
    brand: string | null;
    model: string | null;
    status: string;
    status_label: string;
    received_at: string;
}

interface UnpaidMotor {
    id: number;
    reference_number: string;
    customer_id: number;
    customer_name: string;
    customer_phone: string;
    status: string;
    status_label: string;
    remaining: string;
}

interface Stats {
    inWorkshop: number;
    readyCount: number;
    overdueCount: number;
    unpaidTotal: string;
    unpaidCount: number;
}

interface Props {
    stats: Stats;
    recentMotors: Motor[];
    unpaidMotors: UnpaidMotor[];
}

const statusColors: Record<string, string> = {
    in_workshop: 'bg-blue-100 text-blue-800 border-blue-200',
    in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    ready: 'bg-green-100 text-green-800 border-green-200',
    delivered: 'bg-gray-100 text-gray-700 border-gray-200',
};

export function WorkshopDashboard({ stats, recentMotors, unpaidMotors }: Props) {
    return (
        <>
            <Header>
                <div className="flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    <span className="text-lg font-semibold">ورشة الموتورات</span>
                </div>
                <div className="ms-auto flex items-center gap-3">
                    <ThemeSwitch />
                    <ProfileDropdown />
                </div>
            </Header>

            <Main>
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">لوحة التحكم</h1>
                        <p className="mt-1 text-muted-foreground">نظرة عامة على حالة الورشة</p>
                    </div>
                    <Link href="/motors/create">
                        <Button size="lg" className="min-h-12 gap-2 text-base">
                            <Plus className="h-5 w-5" />
                            تسجيل موتور جديد
                        </Button>
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">
                                في الورشة
                            </CardTitle>
                            <Wrench className="h-5 w-5 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold text-blue-700 dark:text-blue-400">
                                {stats.inWorkshop}
                            </div>
                            <p className="mt-1 text-xs text-blue-600/70">موتور نشط</p>
                        </CardContent>
                    </Card>

                    <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">
                                جاهز للاستلام
                            </CardTitle>
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold text-green-700 dark:text-green-400">
                                {stats.readyCount}
                            </div>
                            <p className="mt-1 text-xs text-green-600/70">في انتظار العميل</p>
                        </CardContent>
                    </Card>

                    <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/30">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-400">
                                متأخرة
                            </CardTitle>
                            <Clock className="h-5 w-5 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold text-orange-700 dark:text-orange-400">
                                {stats.overdueCount}
                            </div>
                            <p className="mt-1 text-xs text-orange-600/70">أكثر من 7 أيام</p>
                        </CardContent>
                    </Card>

                    <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">
                                فواتير غير مدفوعة
                            </CardTitle>
                            <DollarSign className="h-5 w-5 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-red-700 dark:text-red-400">
                                {stats.unpaidTotal}
                            </div>
                            <p className="mt-1 text-xs text-red-600/70">{stats.unpaidCount} موتور — إجمالي المستحق</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Unpaid Motors */}
                {unpaidMotors.length > 0 && (
                    <Card className="border-red-100">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg text-red-700 dark:text-red-400">أعلى الفواتير غير المدفوعة</CardTitle>
                            <Link href="/motors">
                                <Button variant="outline" size="sm">عرض الكل</Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-right">رقم المرجع</TableHead>
                                        <TableHead className="text-right">العميل</TableHead>
                                        <TableHead className="text-right">الجوال</TableHead>
                                        <TableHead className="text-right">الحالة</TableHead>
                                        <TableHead className="text-right">المتبقي</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {unpaidMotors.map((motor) => (
                                        <TableRow key={motor.id} className="hover:bg-muted/50">
                                            <TableCell>
                                                <Link
                                                    href={`/motors/${motor.id}`}
                                                    className="font-mono font-medium text-primary hover:underline underline-offset-4"
                                                >
                                                    {motor.reference_number}
                                                </Link>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                <Link href={`/customers/${motor.customer_id}`} className="hover:underline underline-offset-4 text-primary">
                                                    {motor.customer_name}
                                                </Link>
                                            </TableCell>
                                            <TableCell dir="ltr" className="text-right">{motor.customer_phone}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={`min-w-[90px] justify-center text-sm ${statusColors[motor.status] ?? ''}`}
                                                >
                                                    {motor.status_label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-bold text-red-600 dark:text-red-400">
                                                {motor.remaining}
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
                        </CardContent>
                    </Card>
                )}

                {/* Recent Motors */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-xl">آخر الموتورات المستلمة</CardTitle>
                        <Link href="/motors">
                            <Button variant="outline" size="sm">
                                عرض الكل
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {recentMotors.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <AlertCircle className="mb-3 h-10 w-10 opacity-40" />
                                <p className="text-lg">لا توجد موتورات مسجلة بعد</p>
                                <Link href="/motors/create" className="mt-3">
                                    <Button>سجّل أول موتور</Button>
                                </Link>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-right">رقم المرجع</TableHead>
                                        <TableHead className="text-right">العميل</TableHead>
                                        <TableHead className="text-right">الجوال</TableHead>
                                        <TableHead className="text-right">الماركة / الموديل</TableHead>
                                        <TableHead className="text-right">الحالة</TableHead>
                                        <TableHead className="text-right">تاريخ الاستلام</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentMotors.map((motor) => (
                                        <TableRow key={motor.id} className="hover:bg-muted/50">
                                            <TableCell>
                                                <Link
                                                    href={`/motors/${motor.id}`}
                                                    className="font-mono font-medium text-primary hover:underline underline-offset-4"
                                                >
                                                    {motor.reference_number}
                                                </Link>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                <Link href={`/customers/${motor.customer_id}`} className="hover:underline underline-offset-4 text-primary">
                                                    {motor.customer_name}
                                                </Link>
                                            </TableCell>
                                            <TableCell dir="ltr" className="text-right">
                                                {motor.customer_phone}
                                            </TableCell>
                                            <TableCell>
                                                {motor.brand || motor.model
                                                    ? `${motor.brand ?? ''} ${motor.model ?? ''}`.trim()
                                                    : '—'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={`min-w-[90px] justify-center text-sm ${statusColors[motor.status] ?? ''}`}
                                                >
                                                    {motor.status_label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{motor.received_at}</TableCell>
                                            <TableCell>
                                                <Link href={`/motors/${motor.id}`}>
                                                    <Button variant="ghost" size="sm">
                                                        عرض
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </Main>
        </>
    );
}
