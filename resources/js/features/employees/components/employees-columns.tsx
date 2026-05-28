import { DataTableColumnHeader } from '@/components/data-table';
import { Checkbox } from '@/components/ui/checkbox';
import { type ColumnDef } from '@tanstack/react-table';
import { type Employee } from '../data/schema';
import { DataTableRowActions } from './data-table-row-actions';

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
