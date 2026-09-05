import type { UserRole } from '@/types';

type User = {
    name: string;
    email: string;
    avatar: string;
};

type Team = {
    name: string;
    logo: React.ElementType;
    plan: string;
};

type BaseNavItem = {
    title: string;
    badge?: string;
    icon?: React.ElementType;
    /** Omit to show the item to every signed-in user. */
    roles?: UserRole[];
};

type NavLink = BaseNavItem & {
    url: string;
    items?: never;
};

type NavCollapsible = BaseNavItem & {
    items: (BaseNavItem & { url: string })[];
    url?: never;
};

type NavItem = NavCollapsible | NavLink;

type NavGroup = {
    title: string;
    items: NavItem[];
};

type SidebarData = {
    user: User;
    teams: Team[];
    navGroups: NavGroup[];
};

export type { NavCollapsible, NavGroup, NavItem, NavLink, SidebarData };
