import {
    Bell,
    Bug,
    Construction,
    FileX,
    LayoutDashboard,
    Lock,
    Monitor,
    Palette,
    ServerOff,
    Settings,
    ShieldCheck,
    UserCog,
    Users,
    Wrench,
    ClipboardList,
    Package,
    Truck,
    BarChart3,
    Cog,
} from 'lucide-react';
import { type SidebarData } from '../types';

export const sidebarData: SidebarData = {
    user: {
        name: 'صاحب الورشة',
        email: 'workshop@local.com',
        avatar: '/avatars/shadcn.jpg',
    },
    teams: [
        {
            name: 'ورشة موتورات',
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
                    title: 'الموتورات',
                    url: '/motors',
                    icon: Wrench,
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
            ],
        },
        {
            title: 'المالية',
            items: [
                {
                    title: 'التقارير',
                    url: '/reports',
                    icon: BarChart3,
                },
            ],
        },
        {
            title: 'الإعدادات',
            items: [
                {
                    title: 'الإعدادات',
                    icon: Settings,
                    items: [
                        {
                            title: 'الملف الشخصي',
                            url: '/settings',
                            icon: UserCog,
                        },
                        {
                            title: 'المظهر',
                            url: '/settings/appearance',
                            icon: Palette,
                        },
                        {
                            title: 'الإشعارات',
                            url: '/settings/notifications',
                            icon: Bell,
                        },
                        {
                            title: 'العرض',
                            url: '/settings/display',
                            icon: Monitor,
                        },
                    ],
                },
            ],
        },
    ],
};
