import { cn } from '@/lib/utils';

type WorkshopLogoProps = {
    className?: string;
    variant?: 'color' | 'white' | 'black';
};

const SOURCES = {
    color: '/images/brand/logo-color.png',
    white: '/images/brand/logo-white.png',
    black: '/images/brand/logo-black.png',
} as const;

export function WorkshopLogo({ className, variant = 'color' }: WorkshopLogoProps) {
    return <img src={SOURCES[variant]} alt="ورشة غسان متري" className={cn('object-contain', className)} />;
}
