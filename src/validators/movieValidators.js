import { z } from 'zod';

export const fromTmdbSchema = z.object({
    tmdbId: z.coerce.number().int('tmdbId must be an integer').positive('tmdbId must be positive'),
});
