import { WorkshopDashboard } from '@/features/workshop-dashboard';

interface Props {
    stats: {
        inWorkshop: number;
        readyCount: number;
        unpaidTotal: string;
        unpaidCount: number;
        accountOutstanding: string;
        accountCount: number;
        receivedToday: number;
        deliveredToday: number;
    };
    recentMotors: Array<{
        id: number;
        reference_number: string;
        customer_id: number;
        customer_name: string;
        customer_phone: string;
        status: string;
        status_label: string;
        received_at: string;
        category_name: string | null;
        received_by_name: string | null;
    }>;
    unpaidMotors: Array<{
        id: number;
        reference_number: string;
        customer_id: number;
        customer_name: string;
        customer_phone: string;
        status: string;
        status_label: string;
        remaining: string;
    }>;
}

export default function WorkshopDashboardPage({ stats, recentMotors, unpaidMotors }: Props) {
    return <WorkshopDashboard stats={stats} recentMotors={recentMotors} unpaidMotors={unpaidMotors} />;
}
