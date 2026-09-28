import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { ThemeSwitch } from '@/components/theme-switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from '@inertiajs/react';
import { AlertCircle, CheckCircle2, DollarSign, PackageCheck, PackagePlus, Plus, Wallet, Wrench } from 'lucide-react';

interface Motor {
    id: number;
    reference_number: string;
    customer_id: number;
    customer_name: string;
    customer_phone: string;
    status: string;
    status_label: string;
    received_at: string;
    category_name: string | null;
    received_by_name: string | null;
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
    unpaidTotal: string;
    unpaidCount: number;
    accountOutstanding: string;
    accountCount: number;
    receivedToday: number;
    deliveredToday: number;
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
                    <span className="text-lg font-semibold">ورشة غسان متري</span>
                </div>
                <div className="ms-auto flex items-center gap-3">
                    <ThemeSwitch />
                    <ProfileDropdown />
                </div>
            </Header>

            <Main>
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">لوحة التحكم</h1>
                        <p className="mt-1 text-muted-foreground">نظرة عامة على حالة الورشة</p>
                    </div>
                    <Link href="/motors/create">
                        <Button size="lg" className="min-h-12 w-full gap-2 text-base sm:w-auto">
                            <Plus className="h-5 w-5" />
                            تسجيل طلب جديد
                        </Button>
                    </Link>
                </div>

                <div className="mb-3">
                    <h2 className="text-sm font-semibold tracking-widest text-muted-foreground uppercase">اليوم</h2>
                </div>
                <div className="mb-6 grid grid-cols-2 gap-4">
                    <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">استُلم اليوم</CardTitle>
                            <PackagePlus className="h-5 w-5 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold text-green-700 dark:text-green-400">{stats.receivedToday}</div>
                            <p className="mt-1 text-xs text-green-600/70">طلب استُلم اليوم</p>
                        </CardContent>
                    </Card>

                    <Card className="border-teal-200 bg-teal-50 dark:border-teal-900 dark:bg-teal-950/30">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-teal-700 dark:text-teal-400">سُلِّم اليوم</CardTitle>
                            <PackageCheck className="h-5 w-5 text-teal-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold text-teal-700 dark:text-teal-400">{stats.deliveredToday}</div>
                            <p className="mt-1 text-xs text-teal-600/70">طلب سُلِّم اليوم</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="mb-3">
                    <h2 className="text-sm font-semibold tracking-widest text-muted-foreground uppercase">الإجمالي</h2>
                </div>
                <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">في الورشة</CardTitle>
                            <Wrench className="h-5 w-5 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold text-blue-700 dark:text-blue-400">{stats.inWorkshop}</div>
                            <p className="mt-1 text-xs text-blue-600/70">طلب نشط</p>
                        </CardContent>
                    </Card>

                    <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">جاهز للاستلام</CardTitle>
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold text-green-700 dark:text-green-400">{stats.readyCount}</div>
                            <p className="mt-1 text-xs text-green-600/70">في انتظار العميل</p>
                        </CardContent>
                    </Card>

                    <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">مستحق (دفع مباشر)</CardTitle>
                            <DollarSign className="h-5 w-5 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="font-mono text-3xl font-bold text-red-700 dark:text-red-400" dir="ltr">
                                $ {stats.unpaidTotal}
                            </div>
                            <p className="mt-1 text-xs text-red-600/70">{stats.unpaidCount} فاتورة غير مسددة</p>
                        </CardContent>
                    </Card>

                    <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">مستحق (حساب جاري)</CardTitle>
                            <Wallet className="h-5 w-5 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="font-mono text-3xl font-bold text-blue-700 dark:text-blue-400" dir="ltr">
                                $ {stats.accountOutstanding}
                            </div>
                            <p className="mt-1 text-xs text-blue-600/70">{stats.accountCount} عميل بحساب جاري</p>
                        </CardContent>
                    </Card>
                </div>

                {unpaidMotors.length > 0 && (
                    <Card className="mb-6 border-red-100">
                        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
                            <CardTitle className="text-lg text-red-700 dark:text-red-400">أعلى الفواتير غير المدفوعة</CardTitle>
                            <Link href="/motors">
                                <Button variant="outline" size="sm">
                                    عرض الكل
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent className="overflow-x-auto">
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
                                                    className="font-mono font-medium text-primary underline-offset-4 hover:underline"
                                                >
                                                    {motor.reference_number}
                                                </Link>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                <Link
                                                    href={`/customers/${motor.customer_id}`}
                                                    className="text-primary underline-offset-4 hover:underline"
                                                >
                                                    {motor.customer_name}
                                                </Link>
                                            </TableCell>
                                            <TableCell dir="ltr" className="text-right">
                                                {motor.customer_phone}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={`min-w-[90px] justify-center text-sm ${statusColors[motor.status] ?? ''}`}
                                                >
                                                    {motor.status_label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-bold text-red-600 dark:text-red-400">{motor.remaining}</TableCell>
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
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
                        <CardTitle className="text-xl">آخر الطلبات المستلمة</CardTitle>
                        <Link href="/motors">
                            <Button variant="outline" size="sm">
                                عرض الكل
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent className={recentMotors.length === 0 ? undefined : 'overflow-x-auto'}>
                        {recentMotors.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <AlertCircle className="mb-3 h-10 w-10 opacity-40" />
                                <p className="text-lg">لا توجد طلبات مسجلة بعد</p>
                                <Link href="/motors/create" className="mt-3">
                                    <Button>سجّل أول طلب</Button>
                                </Link>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-right">رقم المرجع</TableHead>
                                        <TableHead className="text-right">العميل</TableHead>
                                        <TableHead className="text-right">الجوال</TableHead>
                                        <TableHead className="text-right">التصنيف</TableHead>
                                        <TableHead className="text-right">الحالة</TableHead>
                                        <TableHead className="text-right">المستلم</TableHead>
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
                                                    className="font-mono font-medium text-primary underline-offset-4 hover:underline"
                                                >
                                                    {motor.reference_number}
                                                </Link>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                <Link
                                                    href={`/customers/${motor.customer_id}`}
                                                    className="text-primary underline-offset-4 hover:underline"
                                                >
                                                    {motor.customer_name}
                                                </Link>
                                            </TableCell>
                                            <TableCell dir="ltr" className="text-right">
                                                {motor.customer_phone}
                                            </TableCell>
                                            <TableCell>{motor.category_name ?? '—'}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={`min-w-[90px] justify-center text-sm ${statusColors[motor.status] ?? ''}`}
                                                >
                                                    {motor.status_label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {motor.received_by_name ? (
                                                    <span className="flex items-center gap-1.5">
                                                        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                                                            {motor.received_by_name
                                                                .trim()
                                                                .split(/\s+/)
                                                                .map((w: string) => w[0])
                                                                .join('')
                                                                .slice(0, 2)
                                                                .toUpperCase()}
                                                        </span>
                                                        <span className="font-medium">{motor.received_by_name}</span>
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
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
