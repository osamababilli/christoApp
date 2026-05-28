import { Employees } from '@/features/employees';
import { type Employee } from '@/features/employees/data/schema';

type EmployeesPageProps = {
    employees: Employee[];
};

export default function EmployeesPage({ employees }: EmployeesPageProps) {
    return <Employees employees={employees} />;
}
