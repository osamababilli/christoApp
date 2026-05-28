import { Users } from '@/features/users';
import { type User } from '@/features/users/data/schema';

type Props = {
    users: User[];
};

export default function SettingsUsersPage({ users }: Props) {
    return <Users users={users} />;
}
