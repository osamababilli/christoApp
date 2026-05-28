import { z } from 'zod';

export const userStatusSchema = z.union([
    z.literal('active'),
    z.literal('inactive'),
    z.literal('suspended'),
]);
export type UserStatus = z.infer<typeof userStatusSchema>;

export const userRoleSchema = z.union([
    z.literal('admin'),
    z.literal('manager'),
    z.literal('cashier'),
]);
export type UserRole = z.infer<typeof userRoleSchema>;

export const userSchema = z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
    phone: z.string().nullable().optional(),
    role: userRoleSchema,
    status: userStatusSchema,
    created_at: z.string(),
});
export type User = z.infer<typeof userSchema>;

export const userListSchema = z.array(userSchema);
