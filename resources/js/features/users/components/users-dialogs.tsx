import { UsersActionDialog } from './users-action-dialog';
import { UsersDeleteDialog } from './users-delete-dialog';
import { useUsers } from './users-provider';

export function UsersDialogs() {
    const { open, setOpen, currentRow, setCurrentRow } = useUsers();

    const closeAndClear = (dialog: typeof open) => {
        setOpen(dialog);
        setTimeout(() => setCurrentRow(null), 500);
    };

    return (
        <>
            <UsersActionDialog key="user-add" open={open === 'add'} onOpenChange={() => setOpen('add')} />

            {currentRow && (
                <>
                    <UsersActionDialog
                        key={`user-edit-${currentRow.id}`}
                        open={open === 'edit'}
                        onOpenChange={() => closeAndClear('edit')}
                        currentRow={currentRow}
                    />
                    <UsersDeleteDialog
                        key={`user-delete-${currentRow.id}`}
                        open={open === 'delete'}
                        onOpenChange={() => closeAndClear('delete')}
                        currentRow={currentRow}
                    />
                </>
            )}
        </>
    );
}
