import { CreditCard, Shield, Users } from 'lucide-react';
import { type UserStatus } from './schema';

export const callTypes = new Map<UserStatus, string>([
    ['active', 'bg-teal-100/30 text-teal-900 dark:text-teal-200 border-teal-200'],
    ['inactive', 'bg-neutral-300/40 border-neutral-300'],
    ['suspended', 'bg-destructive/10 dark:bg-destructive/50 text-destructive dark:text-primary border-destructive/10'],
]);

export const roles = [
    {
        label: 'Admin',
        value: 'admin',
        icon: Shield,
    },
    {
        label: 'Manager',
        value: 'manager',
        icon: Users,
    },
    {
        label: 'Cashier',
        value: 'cashier',
        icon: CreditCard,
    },
] as const;

export const statuses = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Suspended', value: 'suspended' },
] as const;
