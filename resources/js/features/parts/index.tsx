import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { ThemeSwitch } from '@/components/theme-switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { router, Link } from '@inertiajs/react';
import { CheckCircle2, Clock, Package, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Part {
    id: number;
    part_name: string;
    type: string;
    type_label: string;
    quantity: number;
    unit_cost: number;
    total_cost: number;
    is_paid: boolean;
    supplier_name: string | null;
    motor_id: number;
    reference_number: string;
    customer_name: string;
    stage: number;
}

interface PaginatedParts {
    data: Part[];
    total: number;
    last_page: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    parts: PaginatedParts;
    filters: { search?: string; type?: string };
}

const typeConfig: Record<string, { color: string; active: string; badge: string }> = {
    part:      { color: 'border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300',       active: 'ring-2 ring-blue-400',   badge: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'       },
    oil:       { color: 'border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300', active: 'ring-2 ring-amber-400',  badge: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800' },
    transport: { color: 'border-purple-200 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-300', active: 'ring-2 ring-purple-400', badge: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800' },
    cleaning:  { color: 'border-cyan-200 bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:border-cyan-800 dark:text-cyan-300',       active: 'ring-2 ring-cyan-400',   badge: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800'           },
    other:     { color: 'border-gray-200 bg-gray-50 text-gray-600 dark:bg-gray-800/40 dark:border-gray-700 dark:text-gray-300',       active: 'ring-2 ring-gray-400',   badge: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/60 dark:text-gray-300 dark:border-gray-700'           },
};

const typeOptions = [
    { value: '',          label: 'الكل'    },
    { value: 'part',      label: 'قطعة'    },
    { value: 'oil',       label: 'زيت'     },
    { value: 'transport', label: 'نقل'     },
    { value: 'cleaning',  label: 'تنظيف'   },
    { value: 'other',     label: 'أخرى'    },
];

export function Parts({ parts, filters }: Props) {
    const [search, setSearch]             = useState(filters.search ?? '');
    const [type, setType]                 = useState(filters.type ?? '');
    const [deleteTarget, setDeleteTarget] = useState<Part | null>(null);

    function applyFilters(newSearch?: string, newType?: string) {
        router.get('/parts', { search: newSearch ?? search, type: newType ?? type }, {
            preserveState: true,
            replace: true,
        });
    }

    function handleDelete() {
        if (!deleteTarget) return;
        router.delete(`/parts/${deleteTarget.id}`);
        setDeleteTarget(null);
    }

    const paidCount   = parts.data.filter((p) => p.is_paid).length;
    const unpaidCount = parts.data.filter((p) => !p.is_paid).length;
    const totalValue  = parts.data.reduce((s, p) => s + Number(p.total_cost), 0);

    return (
        <>
            <Header fixed>
                <div className="flex flex-1 items-center gap-3">
                    <div className="relative max-w-sm flex-1">
                        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            className="ps-9 min-h-[44px] text-base"
                            placeholder="بحث بالقطعة أو الرقم المرجعي أو العميل..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                        />
                    </div>
                    <Button onClick={() => applyFilters()} variant="outline" className="min-h-[44px]">
                        بحث
                    </Button>
                </div>
                <div className="ms-auto flex items-center gap-3">
                    <ThemeSwitch />
                    <ProfileDropdown />
                </div>
            </Header>

            <Main className="flex flex-1 flex-col gap-5">

                {/* Title + stats */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">القطع والمستلزمات</h2>
                        <p className="text-muted-foreground">إجمالي: {parts.total} قطعة</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2 shadow-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium">{paidCount} مدفوع</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2 shadow-sm">
                            <Clock className="h-4 w-4 text-orange-500" />
                            <span className="text-sm font-medium">{unpaidCount} غير مدفوع</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2 shadow-sm">
                            <Package className="h-4 w-4 text-primary" />
                            <span className="text-sm font-bold text-primary">{totalValue.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Type filter chips */}
                <div className="flex flex-wrap gap-2">
                    {typeOptions.map((opt) => {
                        const isActive = type === opt.value;
                        const cfg = typeConfig[opt.value];
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => { setType(opt.value); applyFilters(undefined, opt.value); }}
                                className={cn(
                                    'rounded-full border px-4 py-1.5 text-sm font-medium transition-all cursor-pointer',
                                    opt.value === ''
                                        ? cn('border-muted-foreground/30 bg-muted text-muted-foreground', isActive && 'ring-2 ring-muted-foreground/50 bg-muted/80')
                                        : cn(cfg.color, isActive && cfg.active),
                                )}
                            >
                                {isActive && <span className="me-1.5">✓</span>}
                                {opt.label}
                            </button>
                        );
                    })}
                </div>

                {/* Table */}
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-right">الموتور</TableHead>
                                    <TableHead className="text-right">العميل</TableHead>
                                    <TableHead className="text-right">م</TableHead>
                                    <TableHead className="text-right">القطعة</TableHead>
                                    <TableHead className="text-right">النوع</TableHead>
                                    <TableHead className="text-right">الكمية</TableHead>
                                    <TableHead className="text-right">سعر الوحدة</TableHead>
                                    <TableHead className="text-right">الإجمالي</TableHead>
                                    <TableHead className="text-right">الدفع</TableHead>
                                    <TableHead className="text-right">المورد</TableHead>
                                    <TableHead />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {parts.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={11} className="py-16 text-center">
                                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                <Package className="h-10 w-10 opacity-30" />
                                                <p className="text-lg">لا توجد قطع مطابقة</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    parts.data.map((part) => {
                                        const cfg = typeConfig[part.type] ?? typeConfig.other;
                                        return (
                                            <TableRow key={part.id} className="hover:bg-muted/40">
                                                <TableCell>
                                                    <Link
                                                        href={`/motors/${part.motor_id}`}
                                                        className="font-mono text-sm font-semibold text-primary hover:underline underline-offset-4"
                                                    >
                                                        {part.reference_number}
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="font-medium text-sm">{part.customer_name}</TableCell>
                                                <TableCell>
                                                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                                                        {part.stage}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="font-medium">{part.part_name}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={cn('text-xs', cfg.badge)}>
                                                        {part.type_label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm">{Number(part.quantity)}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">{Number(part.unit_cost).toFixed(2)}</TableCell>
                                                <TableCell className="font-semibold">{Number(part.total_cost).toFixed(2)}</TableCell>
                                                <TableCell>
                                                    {part.is_paid ? (
                                                        <Badge variant="outline" className="gap-1 border-green-200 bg-green-50 text-green-700 dark:bg-green-950/40 dark:border-green-800 dark:text-green-300">
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            مدفوع
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="gap-1 border-orange-200 bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:border-orange-800 dark:text-orange-300">
                                                            <Clock className="h-3 w-3" />
                                                            معلق
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {part.supplier_name ?? '—'}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                                        onClick={() => setDeleteTarget(part)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Pagination */}
                {parts.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        {parts.links.map((link, i) => (
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

            {/* Delete confirmation */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                        <AlertDialogDescription>
                            سيتم حذف القطعة{' '}
                            <span className="font-bold text-foreground">"{deleteTarget?.part_name}"</span>{' '}
                            من الموتور{' '}
                            <span className="font-bold text-foreground">{deleteTarget?.reference_number}</span>.
                            <br />
                            هذا الإجراء لا يمكن التراجع عنه.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleDelete}
                        >
                            نعم، احذف
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
