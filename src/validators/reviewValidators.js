import { z } from 'zod';

export const createReviewSchema = z.object({
    rating: z.coerce.number().int().min(1, 'Rating 1-10').max(10),
    text: z.string().max(2000).optional().nullable(),
});
