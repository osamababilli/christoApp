import { buttonVariants } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Link, router } from '@inertiajs/react';
import { useState, type JSX } from 'react';

type SidebarNavProps = React.HTMLAttributes<HTMLElement> & {
    items: {
        href: string;
        title: string;
        icon: JSX.Element;
    }[];
};

export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
    const pathname = window.location.pathname;
    const [val, setVal] = useState(pathname ?? '/settings');

    const handleSelect = (e: string) => {
        setVal(e);
        router.visit(e);
    };

    return (
        <>
            <div className="p-1 md:hidden">
                <Select value={val} onValueChange={handleSelect}>
                    <SelectTrigger className="h-12 sm:w-48">
                        <SelectValue placeholder="اختر قسماً" />
                    </SelectTrigger>
                    <SelectContent>
                        {items.map((item) => (
                            <SelectItem key={item.href} value={item.href}>
                                <div className="flex gap-x-3 px-2 py-1">
                                    <span>{item.icon}</span>
                                    <span className="text-sm">{item.title}</span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <nav
                className={cn(
                    'hidden md:flex flex-col gap-1 py-1',
                    className,
                )}
                {...props}
            >
                {items.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            buttonVariants({ variant: 'ghost' }),
                            pathname === item.href
                                ? 'bg-muted hover:bg-muted font-medium'
                                : 'hover:bg-muted/50',
                            'justify-start gap-2 w-full',
                        )}
                    >
                        {item.icon}
                        {item.title}
                    </Link>
                ))}
            </nav>
        </>
    );
}
