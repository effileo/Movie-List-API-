import { z } from 'zod';

const dataImageAvatar = z
    .string()
    .max(600_000)
    .regex(/^data:image\/(jpeg|jpg|png|webp);base64,/i);

export const updateProfileSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    bio: z.string().max(500).optional().nullable(),
    avatarUrl: z.preprocess(
        (v) => (v === '' ? null : v),
        z.union([z.null(), dataImageAvatar, z.string().url().max(2048)]).optional()
    ),
    watchlistPublic: z.boolean().optional(),
});
