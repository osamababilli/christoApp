import { z } from 'zod';

export const employeeSchema = z.object({
    id: z.number(),
    full_name: z.string(),
    id_number: z.string(),
    nationality: z.string(),
    blood_type: z.string(),
    emergency_phone: z.string(),
    id_image: z.string().nullable().optional(),
    created_at: z.string(),
});

export type Employee = z.infer<typeof employeeSchema>;
