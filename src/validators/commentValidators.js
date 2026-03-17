import { z } from 'zod';

export const createCommentSchema = z.object({
    text: z.string().min(1, 'Comment text required').max(2000),
});
