import { z } from 'zod';

/** Add to watchlist: tmdbId (or movieId) and optional status. */
export const addToWatchListSchema = z.object({
    movieId: z.string().uuid().optional(),
    tmdbId: z.union([z.number(), z.string().transform(Number)]).optional(),
    status: z.enum(['PLANNED', 'WATCHING', 'COMPLETED', 'DROPPED', 'ANTICIPATED']).optional().default('PLANNED'),
    rating: z.number().min(1).max(10).optional(),
    notes: z.string().max(2000).optional(),
}).refine((data) => data.movieId != null || data.tmdbId != null, {
    message: 'Either movieId or tmdbId is required',
});

export const watchlistCommentSchema = z.object({
    text: z.string().min(1, 'Comment text required').max(2000),
});
