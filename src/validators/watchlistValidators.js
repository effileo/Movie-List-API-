import { z } from 'zod';

const addToWatchListSchema = z
    .object({
        movieId: z.string().uuid().optional(),
        tmdbId: z.coerce.number().int().positive().optional(),
        status: z
            .enum(['PLANNED', 'WATCHING', 'COMPLETED', 'DROPPED'], {
                error: () => ({ message: 'status must be one of PLANNED, WATCHING, COMPLETED, DROPPED' }),
            })
            .optional(),
        rating: z.coerce.number().int().min(0).max(10).optional(),
        notes: z.string().optional(),
    })
    .refine((data) => data.movieId != null || data.tmdbId != null, {
        message: 'Provide either movieId (our DB uuid) or tmdbId (TMDB numeric id)',
    });

export { addToWatchListSchema };