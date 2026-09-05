import type { Ability, SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

/** Reads the permission map the server shares for the signed-in user. */
export function useCan() {
    const { auth } = usePage<SharedData>().props;
    const map = auth?.can ?? {};

    return (ability: Ability): boolean => map[ability] === true;
}
