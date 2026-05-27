import { WorkshopDashboard } from '@/features/workshop-dashboard';

interface Props {
    stats: {
        inWorkshop: number;
        readyCount: number;
        overdueCount: number;
        unpaidTotal: string;
        unpaidCount: number;
    };
    recentMotors: Array<{
        id: number;
        reference_number: string;
        customer_id: number;
        customer_name: string;
        customer_phone: string;
        brand: string | null;
        model: string | null;
        status: string;
        status_label: string;
        received_at: string;
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
