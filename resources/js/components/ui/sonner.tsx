import { useTheme } from '@/context/theme-provider';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

export function Toaster({ ...props }: ToasterProps) {
    const { theme = 'system' } = useTheme();

    return (
        <Sonner
            theme={theme as ToasterProps['theme']}
            dir="rtl"
            position="top-center"
            richColors
            closeButton
            expand={false}
            gap={8}
            offset={16}
            toastOptions={{
                classNames: {
                    toast: [
                        'group',
                        'flex items-center gap-3',
                        'w-full min-w-[320px] max-w-[420px]',
                        'rounded-xl border shadow-lg',
                        'pr-4 pl-10 py-3.5',
                        'text-sm font-medium',
                        'font-[Cairo,Inter,sans-serif]',
                        'backdrop-blur-sm',
                    ].join(' '),
                    title: 'text-[15px] font-semibold leading-snug',
                    description: 'text-[13px] opacity-80 mt-0.5',
                    success: [
                        '!bg-emerald-50 !border-emerald-200 !text-emerald-900',
                        'dark:!bg-emerald-950/60 dark:!border-emerald-800 dark:!text-emerald-100',
                    ].join(' '),
                    error: [
                        '!bg-red-50 !border-red-200 !text-red-900',
                        'dark:!bg-red-950/60 dark:!border-red-800 dark:!text-red-100',
                    ].join(' '),
                    warning: [
                        '!bg-amber-50 !border-amber-200 !text-amber-900',
                        'dark:!bg-amber-950/60 dark:!border-amber-800 dark:!text-amber-100',
                    ].join(' '),
                    info: [
                        '!bg-blue-50 !border-blue-200 !text-blue-900',
                        'dark:!bg-blue-950/60 dark:!border-blue-800 dark:!text-blue-100',
                    ].join(' '),
                    closeButton: '!right-auto !left-2',
                    icon: 'shrink-0 !w-5 !h-5',
                },
            }}
            style={
                {
                    '--normal-bg': 'var(--popover)',
                    '--normal-text': 'var(--popover-foreground)',
                    '--normal-border': 'var(--border)',
                } as React.CSSProperties
            }
            {...props}
        />
    );
}
