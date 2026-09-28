import { WorkshopLogo } from '@/assets/workshop-logo';
import {
    BarChart3,
    ClipboardList,
    ClipboardSignature,
    FileSpreadsheet,
    FolderOpen,
    LayoutDashboard,
    Package,
    ReceiptText,
    Truck,
    UserCircle,
    UserCog,
    Users,
    Vault,
    Wrench,
} from 'lucide-react';
import { type SidebarData } from '../types';

export const sidebarData: SidebarData = {
    user: {
        name: 'مستخدم',
        email: '',
        avatar: '',
    },
    teams: [
        {
            name: 'مخرطة غسان متري',
            logo: WorkshopLogo,
            plan: 'نظام إدارة الورشة',
        },
    ],
    navGroups: [
        {
            title: 'الرئيسية',
            items: [
                { title: 'لوحة التحكم', url: '/', icon: LayoutDashboard },
                { title: 'قيود الاستلام', url: '/motors', icon: Wrench },
                { title: 'عروض الأسعار', url: '/quotations', icon: ClipboardSignature },
                { title: 'الصيانة', url: '/maintenance', icon: ClipboardList },
                { title: 'القطع والمستلزمات', url: '/parts', icon: Package },
                { title: 'العملاء', url: '/customers', icon: Users },
                { title: 'الموردون', url: '/suppliers', icon: Truck },
                { title: 'الموظفون', url: '/employees', icon: UserCircle, roles: ['admin', 'manager'] },
                { title: 'وثائق المحل', url: '/documents', icon: FolderOpen },
            ],
        },
        {
            title: 'المالية',
            items: [
                { title: 'الفواتير', url: '/invoices', icon: FileSpreadsheet },
                { title: 'كشف حساب', url: '/statement', icon: ReceiptText },
                { title: 'المحاسبة والخزنة', url: '/accounting', icon: Vault, roles: ['admin', 'manager'] },
                { title: 'التقارير', url: '/reports', icon: BarChart3, roles: ['admin', 'manager'] },
            ],
        },
        {
            title: 'الإدارة',
            items: [{ title: 'المستخدمون', url: '/settings/users', icon: UserCog, roles: ['admin'] }],
        },
    ],
};
