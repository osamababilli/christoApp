import { EmployeesActionDialog } from './employees-action-dialog';
import { EmployeesDeleteDialog } from './employees-delete-dialog';
import { useEmployees } from './employees-provider';

export function EmployeesDialogs() {
    const { open, setOpen, currentRow, setCurrentRow } = useEmployees();

    const closeAndClear = (dialog: typeof open) => {
        setOpen(dialog);
        setTimeout(() => setCurrentRow(null), 500);
    };

    return (
        <>
            <EmployeesActionDialog key="employee-add" open={open === 'add'} onOpenChange={() => setOpen('add')} />

            {currentRow && (
                <>
                    <EmployeesActionDialog
                        key={`employee-edit-${currentRow.id}`}
                        open={open === 'edit'}
                        onOpenChange={() => closeAndClear('edit')}
                        currentRow={currentRow}
                    />
                    <EmployeesDeleteDialog
                        key={`employee-delete-${currentRow.id}`}
                        open={open === 'delete'}
                        onOpenChange={() => closeAndClear('delete')}
                        currentRow={currentRow}
                    />
                </>
            )}
        </>
    );
}
