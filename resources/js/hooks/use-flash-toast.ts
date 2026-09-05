import type { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';

export function useFlashToast() {
    const { flash } = usePage<SharedData>().props;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success, { duration: 3500, position: 'top-center' });
        if (flash?.error)   toast.error(flash.error,     { duration: 6000, position: 'top-center' });
        if (flash?.warning) toast.warning(flash.warning, { duration: 5000, position: 'top-center' });
        if (flash?.info)    toast.info(flash.info,       { duration: 4000, position: 'top-center' });
    }, [flash]);
}
