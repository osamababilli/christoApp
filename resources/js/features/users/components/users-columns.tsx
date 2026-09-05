import { DataTableColumnHeader } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { type ColumnDef } from '@tanstack/react-table';
import { callTypes, roles } from '../data/data';
import { type User } from '../data/schema';
import { DataTableRowActions } from './data-table-row-actions';

export const usersColumns: ColumnDef<User>[] = [
    {
        id: 'select',
        header: ({ table }) => (
            <Checkbox
                checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
                className="translate-y-[2px]"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
                className="translate-y-[2px]"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
        cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
        enableHiding: false,
    },
    {
        accessorKey: 'email',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
        cell: ({ row }) => <div className="text-nowrap text-sm">{row.getValue('email')}</div>,
    },
    {
        accessorKey: 'phone',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Phone" />,
        cell: ({ row }) => <div className="text-sm">{row.getValue('phone') ?? '—'}</div>,
        enableSorting: false,
    },
    {
        accessorKey: 'role',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
        cell: ({ row }) => {
            const userType = roles.find(({ value }) => value === row.getValue('role'));
            if (!userType) return null;
            return (
                <div className="flex items-center gap-x-2">
                    {userType.icon && <userType.icon size={16} className="text-muted-foreground" />}
                    <span className="text-sm capitalize">{userType.label}</span>
                </div>
            );
        },
        filterFn: (row, id, value) => value.includes(row.getValue(id)),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
            const status = row.getValue<string>('status');
            const badgeColor = callTypes.get(status as Parameters<typeof callTypes.get>[0]);
            return (
                <Badge variant="outline" className={cn('capitalize', badgeColor)}>
                    {status}
                </Badge>
            );
        },
        filterFn: (row, id, value) => value.includes(row.getValue(id)),
        enableHiding: false,
        enableSorting: false,
    },
    {
        id: 'actions',
        cell: DataTableRowActions,
    },
];
