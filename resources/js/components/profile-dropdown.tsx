import { SignOutDialog } from '@/components/sign-out-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import useDialogState from '@/hooks/use-dialog-state';
import type { SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { LogOut, Settings, UserCog } from 'lucide-react';

export function ProfileDropdown() {
    const [open, setOpen] = useDialogState();
    const { auth } = usePage<SharedData>().props;
    const user = auth?.user;

    const initials = user?.name
        ? user.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)
        : 'U';

    return (
        <>
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={user?.avatar} alt={user?.name ?? ''} />
                            <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col gap-1.5">
                            <p className="text-sm leading-none font-medium">{user?.name ?? '—'}</p>
                            <p className="text-xs leading-none text-muted-foreground">{user?.email ?? '—'}</p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        <DropdownMenuItem asChild>
                            <Link href="/settings" className="flex items-center gap-2">
                                <UserCog className="h-4 w-4" />
                                الملف الشخصي
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/settings/appearance" className="flex items-center gap-2">
                                <Settings className="h-4 w-4" />
                                الإعدادات
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        variant="destructive"
                        className="flex items-center gap-2"
                        onClick={() => setOpen(true)}
                    >
                        <LogOut className="h-4 w-4" />
                        تسجيل الخروج
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <SignOutDialog open={!!open} onOpenChange={setOpen} />
        </>
    );
}
