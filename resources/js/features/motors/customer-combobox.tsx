import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, UserPlus } from 'lucide-react';
import { useState } from 'react';

export interface CustomerOption {
    id: number;
    name: string;
    phone: string;
    label: string;
}

interface Props {
    customers: CustomerOption[];
    selectedId: number | null;
    newName: string;
    newPhone: string;
    onSelectExisting: (customer: CustomerOption) => void;
    onNewNameChange: (value: string) => void;
    onNewPhoneChange: (value: string) => void;
    errors?: { customer_id?: string; customer_name?: string; customer_phone?: string };
}

export function CustomerCombobox({ customers, selectedId, newName, newPhone, onSelectExisting, onNewNameChange, onNewPhoneChange, errors }: Props) {
    const [open, setOpen] = useState(false);
    const [isNew, setIsNew] = useState(selectedId === null && (!!newName || !!newPhone));

    const selected = customers.find((c) => c.id === selectedId);

    function handleSelectNew() {
        setIsNew(true);
        onSelectExisting({ id: 0, name: '', phone: '', label: '' });
        setOpen(false);
    }

    function handleSelectExisting(customer: CustomerOption) {
        setIsNew(false);
        onSelectExisting(customer);
        setOpen(false);
    }

    return (
        <div className="space-y-3">
            <div className="space-y-2">
                <Label className="text-base">
                    العميل <span className="text-destructive">*</span>
                </Label>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="min-h-[48px] w-full justify-between text-base font-normal"
                        >
                            <span className={cn(!selected && !isNew && 'text-muted-foreground')}>
                                {isNew ? '— عميل جديد —' : selected ? selected.label : 'اختر عميلاً موجوداً أو أضف جديداً...'}
                            </span>
                            <ChevronDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] max-w-[92vw] p-0" align="start">
                        <Command>
                            <CommandInput placeholder="ابحث بالاسم أو الجوال..." className="h-11 text-base" />
                            <CommandList>
                                <CommandEmpty className="py-4 text-center text-sm text-muted-foreground">لا يوجد عميل مطابق</CommandEmpty>
                                <CommandGroup heading="العملاء الموجودون">
                                    {customers.map((customer) => (
                                        <CommandItem
                                            key={customer.id}
                                            value={customer.label}
                                            onSelect={() => handleSelectExisting(customer)}
                                            className="flex cursor-pointer items-center gap-2 py-3 text-base"
                                        >
                                            <Check
                                                className={cn('h-4 w-4 shrink-0', selectedId === customer.id && !isNew ? 'opacity-100' : 'opacity-0')}
                                            />
                                            <div className="flex flex-col">
                                                <span className="font-medium">{customer.name}</span>
                                                <span className="text-sm text-muted-foreground" dir="ltr">
                                                    {customer.phone}
                                                </span>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                                <CommandSeparator />
                                <CommandGroup>
                                    <CommandItem
                                        onSelect={handleSelectNew}
                                        className="flex cursor-pointer items-center gap-2 py-3 text-base text-primary"
                                    >
                                        <UserPlus className="h-4 w-4 shrink-0" />
                                        <span className="font-medium">إضافة عميل جديد</span>
                                    </CommandItem>
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
                {errors?.customer_id && <p className="text-sm text-destructive">{errors.customer_id}</p>}
            </div>

            {/* New customer fields — shown only when "new" is selected */}
            {isNew && (
                <div className="grid gap-4 rounded-lg border border-dashed p-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="customer_name" className="text-base">
                            اسم العميل <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="customer_name"
                            className="min-h-[48px] text-base"
                            value={newName}
                            onChange={(e) => onNewNameChange(e.target.value)}
                            placeholder="الاسم الكامل"
                            autoFocus
                        />
                        {errors?.customer_name && <p className="text-sm text-destructive">{errors.customer_name}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="customer_phone" className="text-base">
                            رقم الجوال <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="customer_phone"
                            className="min-h-[48px] text-base"
                            dir="ltr"
                            value={newPhone}
                            onChange={(e) => onNewPhoneChange(e.target.value)}
                            placeholder="05xxxxxxxx"
                        />
                        {errors?.customer_phone && <p className="text-sm text-destructive">{errors.customer_phone}</p>}
                    </div>
                </div>
            )}
        </div>
    );
}
