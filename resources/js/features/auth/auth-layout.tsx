import { WorkshopLogo } from '@/assets/workshop-logo';

type AuthLayoutProps = {
    children: React.ReactNode;
};

export function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <div dir="rtl" className="container grid h-svh max-w-none items-center justify-center">
            <div className="mx-auto flex w-full flex-col justify-center space-y-2 py-8 sm:w-[480px] sm:p-8">
                <div className="mb-4 flex items-center justify-center">
                    <WorkshopLogo className="h-20" />
                </div>
                {children}
            </div>
        </div>
    );
}
