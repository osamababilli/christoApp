import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from '@/components/ui/sidebar';
import { useLayout } from '@/context/layout-provider';
import type { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { useMemo } from 'react';
import { sidebarData } from './data/sidebar-data';
import { NavGroup } from './nav-group';
import { NavUser } from './nav-user';
import { TeamSwitcher } from './team-switcher';
import type { NavGroup as NavGroupType } from './types';

export function AppSidebar() {
    const { collapsible, variant } = useLayout();
    const { auth } = usePage<SharedData>().props;
    const role = auth?.user?.role;

    // Hide what the server would reject with 403 anyway
    const navGroups = useMemo<NavGroupType[]>(() =>
        sidebarData.navGroups
            .map((group) => ({
                ...group,
                items: group.items
                    .filter((item) => !item.roles || (role && item.roles.includes(role)))
                    .map((item) => item.items
                        ? { ...item, items: item.items.filter((sub) => !sub.roles || (role && sub.roles.includes(role))) }
                        : item),
            }))
            .filter((group) => group.items.length > 0),
    [role]);

    const user = auth?.user
        ? { name: auth.user.name, email: auth.user.email, avatar: auth.user.avatar ?? '' }
        : sidebarData.user;

    return (
        <Sidebar collapsible={collapsible} variant={variant}>
            <SidebarHeader>
                <TeamSwitcher teams={sidebarData.teams} />
            </SidebarHeader>
            <SidebarContent>
                {navGroups.map((props) => (
                    <NavGroup key={props.title} {...props} />
                ))}
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
