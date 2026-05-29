import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { ThemeSwitch } from '@/components/theme-switch';
import { Separator } from '@/components/ui/separator';
import { SidebarNav } from '@/features/settings/components/sidebar-nav';
import { Palette, Tag, UserCog, Users } from 'lucide-react';

const sidebarNavItems = [
    {
        title: 'الملف الشخصي',
        href: '/settings',
        icon: <UserCog size={18} />,
    },
    {
        title: 'المظهر',
        href: '/settings/appearance',
        icon: <Palette size={18} />,
    },
    {
        title: 'المستخدمون',
        href: '/settings/users',
        icon: <Users size={18} />,
    },
    {
        title: 'التصنيفات',
        href: '/settings/categories',
        icon: <Tag size={18} />,
    },
];

type SettingsLayoutProps = {
    children: React.ReactNode;
};

export function SettingsLayout({ children }: SettingsLayoutProps) {
    return (
        <>
            <Header>
                <div className="ms-auto flex items-center gap-3">
                    <ThemeSwitch />
                    <ProfileDropdown />
                </div>
            </Header>

            <Main fixed>
                <div className="space-y-0.5">
                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl">الإعدادات</h1>
                    <p className="text-muted-foreground">إدارة إعدادات الحساب والتفضيلات.</p>
                </div>
                <Separator className="my-4 lg:my-6" />
                <div className="flex flex-1 flex-col space-y-2 overflow-hidden md:space-y-2 lg:flex-row lg:space-y-0 lg:space-x-12">
                    <aside className="top-0 lg:sticky lg:w-1/5">
                        <SidebarNav items={sidebarNavItems} />
                    </aside>
                    <div className="flex w-full overflow-y-hidden p-1">{children}</div>
                </div>
            </Main>
        </>
    );
}
