import {
    Bug,
    ClipboardSignature,
    Construction,
    FileX,
    LayoutDashboard,
    Lock,
    ServerOff,
    ShieldCheck,
    Users,
    Wrench,
    ClipboardList,
    Package,
    Truck,
    BarChart3,
    Cog,
    UserCircle,
    Vault,
    FolderOpen,
} from 'lucide-react';
import { type SidebarData } from '../types';

export const sidebarData: SidebarData = {
    user: {
        name: 'سوبر ادمن',
        email: 'admin@workshop.com',
        avatar: '/avatars/shadcn.jpg',
    },
    teams: [
        {
            name: 'ورشة غسان متري',
            logo: Cog,
            plan: 'نظام إدارة الورشة',
        },
    ],
    navGroups: [
        {
            title: 'الرئيسية',
            items: [
                {
                    title: 'لوحة التحكم',
                    url: '/',
                    icon: LayoutDashboard,
                },
                {
                    title: 'قيود الاستلام',
                    url: '/motors',
                    icon: Wrench,
                },
                {
                    title: 'عروض الأسعار',
                    url: '/quotations',
                    icon: ClipboardSignature,
                },
                {
                    title: 'الصيانة',
                    url: '/maintenance',
                    icon: ClipboardList,
                },
                {
                    title: 'القطع والمستلزمات',
                    url: '/parts',
                    icon: Package,
                },
                {
                    title: 'العملاء',
                    url: '/customers',
                    icon: Users,
                },
                {
                    title: 'الموردون',
                    url: '/suppliers',
                    icon: Truck,
                },
                {
                    title: 'الموظفون',
                    url: '/employees',
                    icon: UserCircle,
                },
                {
                    title: 'وثائق المحل',
                    url: '/documents',
                    icon: FolderOpen,
                },
            ],
        },
        {
            title: 'المالية',
            items: [
                {
                    title: 'المحاسبة والخزنة',
                    url: '/accounting',
                    icon: Vault,
                },
                {
                    title: 'التقارير',
                    url: '/reports',
                    icon: BarChart3,
                },
            ],
        },
    ],
};
