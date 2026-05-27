import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { ThemeSwitch } from '@/components/theme-switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { router, Link } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useState } from 'react';

interface Customer {
    id: number;
    name: string;
    phone: string;
    email: string | null;
    motors_count: number;
    created_at: string;
}

interface PaginatedCustomers {
    data: Customer[];
    total: number;
    last_page: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    customers: PaginatedCustomers;
    filters: { search?: string };
}

export function Customers({ customers, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    function applyFilters() {
        router.get('/customers', { search }, { preserveState: true, replace: true });
    }

    return (
        <>
            <Header fixed>
                <div className="flex flex-1 items-center gap-3">
                    <div className="relative max-w-sm flex-1">
                        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            className="ps-9 min-h-[44px] text-base"
                            placeholder="بحث بالاسم أو الجوال..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                        />
                    </div>
                    <Button onClick={applyFilters} variant="outline" className="min-h-[44px]">بحث</Button>
                </div>
                <div className="ms-auto flex items-center gap-3">
                    <ThemeSwitch />
                    <ProfileDropdown />
                </div>
            </Header>

            <Main className="flex flex-1 flex-col gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">العملاء</h2>
                    <p className="text-muted-foreground">إجمالي: {customers.total} عميل</p>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-right">الاسم</TableHead>
                                    <TableHead className="text-right">الجوال</TableHead>
                                    <TableHead className="text-right">البريد الإلكتروني</TableHead>
                                    <TableHead className="text-right">عدد الموتورات</TableHead>
                                    <TableHead className="text-right">تاريخ التسجيل</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {customers.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-12 text-center text-muted-foreground text-lg">
                                            لا يوجد عملاء
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    customers.data.map((c) => (
                                        <TableRow key={c.id}>
                                            <TableCell className="font-semibold text-base">{c.name}</TableCell>
                                            <TableCell dir="ltr" className="text-right">{c.phone}</TableCell>
                                            <TableCell>{c.email ?? '—'}</TableCell>
                                            <TableCell>
                                                <span className="font-semibold">{c.motors_count}</span>
                                            </TableCell>
                                            <TableCell>{c.created_at}</TableCell>
                                            <TableCell>
                                                <Link href={`/motors?search=${c.phone}`}>
                                                    <Button variant="ghost" size="sm">
                                                        عرض الموتورات
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {customers.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        {customers.links.map((link, i) => (
                            <Button
                                key={i}
                                variant={link.active ? 'default' : 'outline'}
                                size="sm"
                                disabled={!link.url}
                                onClick={() => link.url && router.visit(link.url)}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </Main>
        </>
    );
}
