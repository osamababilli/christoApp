import { ConfigDrawer } from '@/components/config-drawer';
import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Search } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { Separator } from '@/components/ui/separator';
import type { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { Palette, Tags, UserCog, Users, Wrench } from 'lucide-react';
import { SidebarNav } from './components/sidebar-nav';

export function Settings() {
    const { auth } = usePage<SharedData>().props;
    const isAdmin = auth?.user?.role === 'admin';

    const sidebarNavItems = [
        { title: 'الملف الشخصي', href: '/settings',            icon: <UserCog size={18} /> },
        { title: 'الحساب',        href: '/settings/account',    icon: <Wrench size={18} /> },
        { title: 'المظهر',        href: '/settings/appearance', icon: <Palette size={18} /> },
        ...(isAdmin
            ? [
                  { title: 'المستخدمون', href: '/settings/users',      icon: <Users size={18} /> },
                  { title: 'التصنيفات',  href: '/settings/categories', icon: <Tags size={18} /> },
              ]
            : []),
    ];

    return (
        <>
            <Header>
                <Search />
                <div className="ms-auto flex items-center space-x-4">
                    <ThemeSwitch />
                    <ConfigDrawer />
                    <ProfileDropdown />
                </div>
            </Header>

            <Main fixed>
                <div className="space-y-0.5">
                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl">الإعدادات</h1>
                    <p className="text-muted-foreground">إدارة حسابك ومظهر النظام{isAdmin ? ' والمستخدمين والتصنيفات' : ''}.</p>
                </div>
                <Separator className="my-4 lg:my-6" />
                <div className="flex flex-1 flex-col space-y-2 overflow-hidden md:space-y-2 lg:flex-row lg:space-y-0 lg:space-x-12">
                    <aside className="top-0 lg:sticky lg:w-1/5">
                        <SidebarNav items={sidebarNavItems} />
                    </aside>
                    <div className="flex w-full overflow-y-hidden p-1" />
                </div>
            </Main>
        </>
    );
}
