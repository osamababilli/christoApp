import { DataTableColumnHeader } from '@/components/data-table';
import { Checkbox } from '@/components/ui/checkbox';
import { type ColumnDef } from '@tanstack/react-table';
import { type Employee } from '../data/schema';
import { DataTableRowActions } from './data-table-row-actions';

const SALARY_PERIOD_LABELS: Record<string, string> = {
    daily: 'يومي',
    weekly: 'اسبوعي',
    monthly: 'شهري',
};

export const employeesColumns: ColumnDef<Employee>[] = [
    {
        id: 'select',
        header: ({ table }) => (
            <Checkbox
                checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="تحديد الكل"
                className="translate-y-[2px]"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="تحديد الصف"
                className="translate-y-[2px]"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: 'full_name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="الاسم الكامل" />,
        cell: ({ row }) => <div className="font-medium">{row.getValue('full_name')}</div>,
        enableHiding: false,
    },
    {
        accessorKey: 'id_number',
        header: ({ column }) => <DataTableColumnHeader column={column} title="رقم الهوية" />,
        cell: ({ row }) => <div className="text-sm">{row.getValue('id_number')}</div>,
        meta: { label: 'رقم الهوية' },
    },
    {
        accessorKey: 'document_type',
        header: ({ column }) => <DataTableColumnHeader column={column} title="نوع الوثيقة" />,
        cell: ({ row }) => <div className="text-sm">{row.getValue('document_type') || '—'}</div>,
        meta: { label: 'نوع الوثيقة' },
    },
    {
        accessorKey: 'nationality',
        header: ({ column }) => <DataTableColumnHeader column={column} title="الجنسية" />,
        cell: ({ row }) => <div className="text-sm">{row.getValue('nationality')}</div>,
        meta: { label: 'الجنسية' },
    },
    {
        accessorKey: 'blood_type',
        header: ({ column }) => <DataTableColumnHeader column={column} title="زمرة الدم" />,
        cell: ({ row }) => (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-300">
                {row.getValue('blood_type')}
            </span>
        ),
        enableSorting: false,
        meta: { label: 'زمرة الدم' },
    },
    {
        accessorKey: 'emergency_phone',
        header: ({ column }) => <DataTableColumnHeader column={column} title="رقم الطوارئ" />,
        cell: ({ row }) => <div className="text-sm">{row.getValue('emergency_phone')}</div>,
        enableSorting: false,
        meta: { label: 'رقم الطوارئ' },
    },
    {
        accessorKey: 'emergency_contact_name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="جهة اتصال الطوارئ" />,
        cell: ({ row }) => <div className="text-sm">{row.getValue('emergency_contact_name') || '—'}</div>,
        enableSorting: false,
        meta: { label: 'جهة اتصال الطوارئ' },
    },
    {
        accessorKey: 'emergency_contact_relationship',
        header: ({ column }) => <DataTableColumnHeader column={column} title="صلة القرابة" />,
        cell: ({ row }) => <div className="text-sm">{row.getValue('emergency_contact_relationship') || '—'}</div>,
        enableSorting: false,
        meta: { label: 'صلة القرابة' },
    },
    {
        accessorKey: 'salary_amount',
        header: ({ column }) => <DataTableColumnHeader column={column} title="الراتب" />,
        cell: ({ row }) => {
            const amount: number | null | undefined = row.getValue('salary_amount');
            const period: string | null | undefined = row.original.salary_period;
            if (amount == null) return <div className="text-sm text-muted-foreground">—</div>;
            return (
                <div className="text-sm font-medium">
                    {amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    {period && <span className="ms-1 text-xs font-normal text-muted-foreground">/ {SALARY_PERIOD_LABELS[period] ?? period}</span>}
                </div>
            );
        },
        meta: { label: 'الراتب' },
    },
    {
        accessorKey: 'id_image',
        header: () => <div className="text-center">صورة الهوية</div>,
        cell: ({ row }) => {
            const url: string | null | undefined = row.getValue('id_image');
            if (!url) return <div className="text-center text-muted-foreground text-xs">—</div>;
            return (
                <div className="flex justify-center">
                    <a href={url} target="_blank" rel="noopener noreferrer">
                        <img src={url} alt="صورة الهوية" className="h-10 w-16 rounded object-cover border" />
                    </a>
                </div>
            );
        },
        enableSorting: false,
        enableHiding: false,
    },
    {
        id: 'actions',
        cell: DataTableRowActions,
    },
];
