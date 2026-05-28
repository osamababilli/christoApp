import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Search } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { type User } from './data/schema';
import { UsersDialogs } from './components/users-dialogs';
import { UsersPrimaryButtons } from './components/users-primary-buttons';
import { UsersProvider } from './components/users-provider';
import { UsersTable } from './components/users-table';

type UsersProps = {
    users: User[];
};

export function Users({ users }: UsersProps) {
    return (
        <UsersProvider>
            <Header fixed>
                <Search />
                <div className="ms-auto flex items-center space-x-4">
                    <ThemeSwitch />
                    <ProfileDropdown />
                </div>
            </Header>

            <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
                <div className="flex flex-wrap items-end justify-between gap-2">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">System Users</h2>
                        <p className="text-muted-foreground">Manage users, roles, and access here.</p>
                    </div>
                    <UsersPrimaryButtons />
                </div>
                <UsersTable data={users} />
            </Main>

            <UsersDialogs />
        </UsersProvider>
    );
}
