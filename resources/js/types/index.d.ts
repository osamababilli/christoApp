export type UserRole = 'admin' | 'manager' | 'cashier';

/** Mirrors App\Support\Permissions::MATRIX */
export type Ability =
    | 'view-dashboard'
    | 'manage-motors'
    | 'manage-maintenance'
    | 'manage-parts'
    | 'manage-customers'
    | 'manage-quotations'
    | 'manage-suppliers'
    | 'manage-invoices'
    | 'record-payments'
    | 'manage-documents'
    | 'archive-motors'
    | 'delete-maintenance'
    | 'delete-parts'
    | 'delete-customers'
    | 'delete-quotations'
    | 'delete-suppliers'
    | 'delete-invoices'
    | 'delete-payments'
    | 'delete-documents'
    | 'convert-quotations'
    | 'view-accounting'
    | 'manage-accounting'
    | 'view-reports'
    | 'manage-employees'
    | 'purge-motors'
    | 'manage-users'
    | 'manage-categories';

export interface Auth {
    user: User | null;
    can: Partial<Record<Ability, boolean>>;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    flash: {
        success: string | null;
        error: string | null;
        warning: string | null;
        info: string | null;
    };
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    avatar?: string;
    [key: string]: unknown;
}
