import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Search } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { type Employee } from './data/schema';
import { EmployeesDialogs } from './components/employees-dialogs';
import { EmployeesPrimaryButtons } from './components/employees-primary-buttons';
import { EmployeesProvider } from './components/employees-provider';
import { EmployeesTable } from './components/employees-table';

type EmployeesProps = {
    employees: Employee[];
};

export function Employees({ employees }: EmployeesProps) {
    return (
        <EmployeesProvider>
            <Header fixed>
                <Search placeholder="بحث..." />
                <div className="ms-auto flex items-center space-x-4">
                    <ThemeSwitch />
                    <ProfileDropdown />
                </div>
            </Header>

            <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
                <div className="flex flex-wrap items-end justify-between gap-2">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">معلومات الموظفين</h2>
                        <p className="text-muted-foreground">إدارة بيانات الموظفين ومعلوماتهم الشخصية.</p>
                    </div>
                    <EmployeesPrimaryButtons />
                </div>
                <EmployeesTable data={employees} />
            </Main>

            <EmployeesDialogs />
        </EmployeesProvider>
    );
}
