import { z } from 'zod';

export const employeeSchema = z.object({
    id: z.number(),
    full_name: z.string(),
    id_number: z.string(),
    document_type: z.string().nullable().optional(),
    nationality: z.string(),
    blood_type: z.string(),
    emergency_phone: z.string(),
    emergency_contact_name: z.string().nullable().optional(),
    emergency_contact_relationship: z.string().nullable().optional(),
    id_image: z.string().nullable().optional(),
    created_at: z.string(),
});

export type Employee = z.infer<typeof employeeSchema>;
