import { z } from 'zod';

export const updateProfileSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    bio: z.string().max(500).optional().nullable(),
    avatarUrl: z.string().url().optional().nullable(),
    watchlistPublic: z.boolean().optional(),
});
