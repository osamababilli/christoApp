import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props {
    links: PaginationLink[];
    className?: string;
    preserveState?: boolean;
}

/** Laravel paginator links rendered as plain buttons — no raw HTML from the server reaches the DOM. */
export function PaginationLinks({ links, className, preserveState = true }: Props) {
    if (links.length <= 3) return null;

    const last = links.length - 1;

    return (
        <nav aria-label="ترقيم الصفحات" className={cn('flex items-center justify-center gap-1.5', className)}>
            {links.map((link, i) => {
                const isPrev = i === 0;
                const isNext = i === last;
                const label  = isPrev ? 'السابق' : isNext ? 'التالي' : link.label.replace(/&hellip;|…/g, '…');

                return (
                    <button
                        key={i}
                        type="button"
                        disabled={!link.url}
                        aria-current={link.active ? 'page' : undefined}
                        aria-label={label}
                        onClick={() => link.url && router.visit(link.url, { preserveState, preserveScroll: true })}
                        className={cn(
                            'flex h-9 min-w-[36px] items-center justify-center rounded-lg border px-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                            link.active
                                ? 'border-foreground bg-foreground text-background'
                                : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground',
                        )}
                    >
                        {isPrev ? <ChevronRight className="h-4 w-4" /> : isNext ? <ChevronLeft className="h-4 w-4" /> : label}
                    </button>
                );
            })}
        </nav>
    );
}
