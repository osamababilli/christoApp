import { WorkshopDashboard } from '@/features/workshop-dashboard';

interface Props {
    stats: {
        inWorkshop: number;
        readyCount: number;
        overdueCount: number;
        unpaidTotal: string;
    };
    recentMotors: Array<{
        id: number;
        reference_number: string;
        customer_name: string;
        customer_phone: string;
        brand: string | null;
        model: string | null;
        status: string;
        status_label: string;
        received_at: string;
    }>;
}

export default function WorkshopDashboardPage({ stats, recentMotors }: Props) {
    return <WorkshopDashboard stats={stats} recentMotors={recentMotors} />;
}
