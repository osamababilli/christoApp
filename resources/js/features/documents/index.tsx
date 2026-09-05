import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { ThemeSwitch } from '@/components/theme-switch';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCan } from '@/hooks/use-can';
import { cn } from '@/lib/utils';
import { router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    Bell,
    BellOff,
    Calendar,
    CheckCircle2,
    Clock,
    Download,
    FileArchive,
    FileImage,
    FilePen,
    FileSpreadsheet,
    FileText,
    FolderOpen,
    Loader2,
    Plus,
    Shield,
    Trash2,
    Upload,
    X,
    XCircle,
} from 'lucide-react';
import { useRef, useState } from 'react';

/* ─── types ─── */

interface Document {
    id: number;
    name: string;
    description: string | null;
    original_name: string;
    mime_type: string | null;
    file_size_formatted: string;
    renewal_date: string | null;
    reminder_days_before: number;
    reminder_sent_at: string | null;
    status: 'active' | 'expiring' | 'expired';
    days_remaining: number | null;
    created_at: string;
}

interface Stats {
    total: number;
    expiring: number;
    expired: number;
}
interface Props {
    documents: Document[];
    stats: Stats;
}

/* ─── file type icon ─── */

function FileIcon({ mime, className }: { mime: string | null; className?: string }) {
    const cls = cn('h-8 w-8', className);
    if (!mime) return <FileText className={cls} />;
    if (mime.includes('pdf')) return <FileText className={cn(cls, 'text-red-500')} />;
    if (mime.includes('word') || mime.includes('doc')) return <FilePen className={cn(cls, 'text-blue-500')} />;
    if (mime.includes('sheet') || mime.includes('excel') || mime.includes('xls')) return <FileSpreadsheet className={cn(cls, 'text-green-500')} />;
    if (mime.includes('image')) return <FileImage className={cn(cls, 'text-purple-500')} />;
    if (mime.includes('zip') || mime.includes('rar')) return <FileArchive className={cn(cls, 'text-amber-500')} />;
    return <FileText className={cn(cls, 'text-muted-foreground')} />;
}

/* ─── status config ─── */

const STATUS = {
    active: {
        label: 'ساري',
        icon: CheckCircle2,
        cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
        dot: 'bg-emerald-500',
    },
    expiring: {
        label: 'ينتهي قريباً',
        icon: AlertTriangle,
        cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
        dot: 'bg-amber-500',
    },
    expired: {
        label: 'منتهي',
        icon: XCircle,
        cls: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
        dot: 'bg-red-500',
    },
};

const REMINDER_PRESETS = [
    { label: 'أسبوع', days: 7 },
    { label: 'أسبوعان', days: 14 },
    { label: 'شهر', days: 30 },
    { label: 'شهران', days: 60 },
    { label: '3 أشهر', days: 90 },
];

/* ─── upload form ─── */

function UploadForm({ onCancel }: { onCancel: () => void }) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [customDays, setCustomDays] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm<{
        name: string;
        description: string;
        file: File | null;
        renewal_date: string;
        reminder_days_before: string;
    }>({
        name: '',
        description: '',
        file: null,
        renewal_date: '',
        reminder_days_before: '30',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/documents', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onCancel();
            },
        });
    }

    function handleFile(file: File | undefined | null) {
        if (!file) return;
        setData('file', file);
        if (!data.name) setData('name', file.name.replace(/\.[^.]+$/, ''));
    }

    return (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="h-1 w-full bg-gradient-to-r from-primary/50 to-primary" />
            <form onSubmit={submit} className="space-y-5 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Upload className="h-5 w-5 text-muted-foreground" />
                        <h4 className="text-base font-semibold">رفع وثيقة جديدة</h4>
                    </div>
                    <button type="button" onClick={onCancel} className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Drop zone */}
                <div
                    onClick={() => fileRef.current?.click()}
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setDragOver(false);
                        handleFile(e.dataTransfer.files[0]);
                    }}
                    className={cn(
                        'cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors',
                        dragOver
                            ? 'border-primary bg-primary/5'
                            : data.file
                              ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                              : 'border-muted-foreground/20 hover:border-primary/40 hover:bg-muted/30',
                    )}
                >
                    <input ref={fileRef} type="file" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
                    {data.file ? (
                        <div className="flex items-center justify-center gap-3">
                            <FileIcon mime={data.file.type} />
                            <div className="text-start">
                                <p className="text-sm font-medium">{data.file.name}</p>
                                <p className="text-xs text-muted-foreground">{(data.file.size / 1024).toFixed(1)} KB</p>
                            </div>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setData('file', null);
                                }}
                                className="ms-auto text-muted-foreground transition-colors hover:text-destructive"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Upload className="mx-auto h-8 w-8 text-muted-foreground/40" />
                            <p className="text-sm font-medium">اسحب الملف هنا أو انقر للاختيار</p>
                            <p className="text-xs text-muted-foreground">PDF, Word, Excel, صور — حتى 20MB</p>
                        </div>
                    )}
                </div>
                {errors.file && <p className="text-xs text-destructive">{errors.file}</p>}

                {/* Name + Description */}
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                        <Label className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                            اسم الوثيقة <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            className="min-h-[42px]"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="مثال: رخصة تجارية، عقد إيجار..."
                            autoFocus
                        />
                        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                        <Label className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">الوصف</Label>
                        <Textarea
                            className="min-h-[70px] resize-none text-sm"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            placeholder="ملاحظات أو تفاصيل إضافية..."
                        />
                    </div>
                </div>

                {/* Renewal date */}
                <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
                    <p className="flex items-center gap-1.5 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                        <Calendar className="h-3.5 w-3.5" /> إعدادات التجديد والتذكير
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-muted-foreground">تاريخ التجديد</Label>
                            <Input
                                type="date"
                                dir="ltr"
                                className="min-h-[42px]"
                                value={data.renewal_date}
                                onChange={(e) => setData('renewal_date', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-muted-foreground">إرسال التذكير قبل</Label>
                            <div className="flex flex-wrap gap-1.5">
                                {REMINDER_PRESETS.map((p) => (
                                    <button
                                        key={p.days}
                                        type="button"
                                        onClick={() => {
                                            setData('reminder_days_before', String(p.days));
                                            setCustomDays(false);
                                        }}
                                        className={cn(
                                            'cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all',
                                            !customDays && data.reminder_days_before === String(p.days)
                                                ? 'border-primary bg-primary text-primary-foreground'
                                                : 'border-border bg-background hover:bg-muted',
                                        )}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setCustomDays(true)}
                                    className={cn(
                                        'cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all',
                                        customDays
                                            ? 'border-primary bg-primary text-primary-foreground'
                                            : 'border-border bg-background hover:bg-muted',
                                    )}
                                >
                                    مخصص
                                </button>
                            </div>
                            {customDays && (
                                <div className="mt-1 flex items-center gap-2">
                                    <Input
                                        type="number"
                                        min="1"
                                        max="365"
                                        className="min-h-[36px] w-24"
                                        value={data.reminder_days_before}
                                        onChange={(e) => setData('reminder_days_before', e.target.value)}
                                        placeholder="30"
                                    />
                                    <span className="text-xs text-muted-foreground">يوم قبل التجديد</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 pt-1">
                    <Button type="submit" className="min-h-[42px] flex-1 gap-2 font-semibold" disabled={processing}>
                        {processing ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" /> جاري الرفع...
                            </>
                        ) : (
                            <>
                                <Upload className="h-4 w-4" /> رفع الوثيقة
                            </>
                        )}
                    </Button>
                    <Button type="button" variant="outline" className="min-h-[42px] px-6" onClick={onCancel}>
                        إلغاء
                    </Button>
                </div>
            </form>
        </div>
    );
}

/* ─── document card ─── */

function DocumentCard({ doc, onDelete }: { doc: Document; onDelete: () => void }) {
    const can = useCan();
    const st = STATUS[doc.status];

    return (
        <div
            className={cn(
                'group relative rounded-2xl border bg-card p-5 transition-all duration-200 hover:shadow-md',
                doc.status === 'expired' && 'border-red-200 dark:border-red-900',
                doc.status === 'expiring' && 'border-amber-200 dark:border-amber-900',
            )}
        >
            {/* Top row */}
            <div className="flex items-start gap-3">
                <div
                    className={cn(
                        'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border',
                        doc.status === 'expired'
                            ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30'
                            : doc.status === 'expiring'
                              ? 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30'
                              : 'border-border bg-muted/50',
                    )}
                >
                    <FileIcon mime={doc.mime_type} className="h-6 w-6" />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm leading-tight font-semibold">{doc.name}</h3>
                        <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold', st.cls)}>
                            <span className={cn('h-1.5 w-1.5 rounded-full', st.dot)} />
                            {st.label}
                        </span>
                    </div>
                    {doc.description && <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{doc.description}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">
                        {doc.original_name} · {doc.file_size_formatted}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                    <a href={`/documents/${doc.id}/download`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="تنزيل">
                            <Download className="h-4 w-4" />
                        </Button>
                    </a>
                    {can('delete-documents') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                            title="حذف"
                            onClick={onDelete}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Renewal info */}
            {doc.renewal_date && (
                <div
                    className={cn(
                        'mt-4 flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5',
                        doc.status === 'expired'
                            ? 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20'
                            : doc.status === 'expiring'
                              ? 'border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20'
                              : 'border-border bg-muted/30',
                    )}
                >
                    <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <div>
                            <p className="text-xs text-muted-foreground">تاريخ التجديد</p>
                            <p className="text-sm font-semibold" dir="ltr">
                                {doc.renewal_date}
                            </p>
                        </div>
                    </div>
                    <div className="text-end">
                        {doc.days_remaining !== null && (
                            <p
                                className={cn(
                                    'text-sm font-bold',
                                    doc.status === 'expired'
                                        ? 'text-red-600 dark:text-red-400'
                                        : doc.status === 'expiring'
                                          ? 'text-amber-600 dark:text-amber-400'
                                          : 'text-emerald-600 dark:text-emerald-400',
                                )}
                            >
                                {doc.days_remaining < 0
                                    ? `منتهي منذ ${Math.abs(doc.days_remaining)} يوم`
                                    : doc.days_remaining === 0
                                      ? 'ينتهي اليوم!'
                                      : `${doc.days_remaining} يوم متبقي`}
                            </p>
                        )}
                        <div className="mt-0.5 flex items-center justify-end gap-1">
                            {doc.reminder_sent_at ? (
                                <Bell className="h-3 w-3 text-muted-foreground" />
                            ) : (
                                <BellOff className="h-3 w-3 text-muted-foreground" />
                            )}
                            <p className="text-xs text-muted-foreground">
                                تذكير قبل {doc.reminder_days_before} يوم
                                {doc.reminder_sent_at ? ` · أُرسل ${doc.reminder_sent_at}` : ''}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {!doc.renewal_date && (
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>بدون تاريخ تجديد</span>
                    <span className="mx-1">·</span>
                    <Clock className="h-3.5 w-3.5" />
                    <span>رُفع {doc.created_at}</span>
                </div>
            )}
        </div>
    );
}

/* ─── main component ─── */

export function ShopDocuments({ documents, stats }: Props) {
    const [showForm, setShowForm] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);

    function handleDelete() {
        if (!deleteTarget) return;
        router.delete(`/documents/${deleteTarget.id}`, { preserveScroll: true });
        setDeleteTarget(null);
    }

    const hasAlerts = stats.expiring > 0 || stats.expired > 0;

    return (
        <>
            <Header fixed>
                <div className="flex flex-1 items-center gap-2">
                    <FolderOpen className="h-5 w-5 text-muted-foreground" />
                    <h2 className="text-base font-semibold">وثائق المحل</h2>
                </div>
                <div className="ms-auto flex items-center gap-3">
                    <ThemeSwitch />
                    <ProfileDropdown />
                </div>
            </Header>

            <Main className="flex flex-1 flex-col gap-6 pb-12">
                {/* Title + add */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">ملفات ووثائق المحل</h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">{stats.total} وثيقة مسجّلة</p>
                    </div>
                    <Button onClick={() => setShowForm(!showForm)} className="min-h-[42px] gap-2 px-5 font-semibold shadow-sm">
                        {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        {showForm ? 'إغلاق' : 'رفع وثيقة'}
                    </Button>
                </div>

                {/* Alert banner */}
                {hasAlerts && (
                    <div
                        className={cn(
                            'flex flex-wrap items-center gap-4 rounded-2xl border p-4',
                            stats.expired > 0
                                ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30'
                                : 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30',
                        )}
                    >
                        <AlertTriangle
                            className={cn(
                                'h-5 w-5 shrink-0',
                                stats.expired > 0 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400',
                            )}
                        />
                        <div className="flex-1">
                            <p
                                className={cn(
                                    'text-sm font-semibold',
                                    stats.expired > 0 ? 'text-red-800 dark:text-red-300' : 'text-amber-800 dark:text-amber-300',
                                )}
                            >
                                تنبيه: وثائق تحتاج مراجعة
                            </p>
                            <p
                                className={cn(
                                    'mt-0.5 text-xs',
                                    stats.expired > 0 ? 'text-red-700/80 dark:text-red-400/80' : 'text-amber-700/80 dark:text-amber-400/80',
                                )}
                            >
                                {stats.expired > 0 && `${stats.expired} وثيقة منتهية الصلاحية`}
                                {stats.expired > 0 && stats.expiring > 0 && ' · '}
                                {stats.expiring > 0 && `${stats.expiring} وثيقة تنتهي قريباً`}
                            </p>
                        </div>
                    </div>
                )}

                {/* Upload form */}
                {showForm && <UploadForm onCancel={() => setShowForm(false)} />}

                {/* Stats row */}
                {stats.total > 0 && (
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { label: 'إجمالي الوثائق', value: stats.total, color: 'text-foreground', icon: FolderOpen },
                            { label: 'ينتهي قريباً', value: stats.expiring, color: 'text-amber-600 dark:text-amber-400', icon: AlertTriangle },
                            { label: 'منتهي الصلاحية', value: stats.expired, color: 'text-red-600 dark:text-red-400', icon: XCircle },
                        ].map(({ label, value, color, icon: Icon }) => (
                            <div key={label} className="rounded-2xl border bg-card px-5 py-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-muted-foreground">{label}</p>
                                    <Icon className={cn('h-4 w-4', color)} />
                                </div>
                                <p className={cn('mt-2 text-2xl font-bold', color)}>{value}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Documents grid */}
                {documents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed py-20 text-muted-foreground">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/20">
                            <Shield className="h-7 w-7 opacity-30" />
                        </div>
                        <div className="text-center">
                            <p className="font-semibold">لا توجد وثائق مرفوعة</p>
                            <p className="mt-1 text-sm opacity-60">ارفع وثائقك الهامة كالرخص والعقود للحفاظ عليها</p>
                        </div>
                        <Button variant="outline" className="gap-2" onClick={() => setShowForm(true)}>
                            <Upload className="h-4 w-4" />
                            رفع أول وثيقة
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                        {/* Expired first, then expiring, then active */}
                        {[...documents]
                            .sort((a, b) => {
                                const order = { expired: 0, expiring: 1, active: 2 };
                                return order[a.status] - order[b.status];
                            })
                            .map((doc) => (
                                <DocumentCard key={doc.id} doc={doc} onDelete={() => setDeleteTarget(doc)} />
                            ))}
                    </div>
                )}
            </Main>

            <AlertDialog
                open={!!deleteTarget}
                onOpenChange={(open) => {
                    if (!open) setDeleteTarget(null);
                }}
            >
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>تأكيد حذف الوثيقة</AlertDialogTitle>
                        <AlertDialogDescription>
                            سيتم حذف الوثيقة <span className="font-bold text-foreground">"{deleteTarget?.name}"</span> والملف المرفق نهائياً.
                            <br />
                            هذا الإجراء لا يمكن التراجع عنه.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                            className="text-destructive-foreground rounded-xl bg-destructive hover:bg-destructive/90"
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
