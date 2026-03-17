/**
 * Activity Feed controller.
 * Combines recent reviews, comments, and watchlist additions into a single
 * chronological feed so the frontend can render a "Social Pulse" stream.
 */

export function getActivityFeed(prisma) {
    return async (req, res) => {
        const limit = Math.min(parseInt(req.query.limit, 10) || 30, 100);

        // Fetch recent reviews, comments, and watchlist adds in parallel
        const [reviews, comments, watchlistItems] = await Promise.all([
            prisma.review.findMany({
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { id: true, name: true, avatarUrl: true } },
                    movie: { select: { id: true, title: true, posterPath: true, tmdbId: true } },
                },
            }),
            prisma.comment.findMany({
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { id: true, name: true, avatarUrl: true } },
                    movie: { select: { id: true, title: true, posterPath: true, tmdbId: true } },
                },
            }),
            prisma.watchListItem.findMany({
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { id: true, name: true, avatarUrl: true } },
                    movie: { select: { id: true, title: true, posterPath: true, tmdbId: true } },
                },
            }),
        ]);

        // Normalize into a single feed shape
        const feed = [
            ...reviews.map((r) => ({
                type: 'review',
                id: `review-${r.id}`,
                user: r.user,
                movie: r.movie,
                rating: r.rating,
                text: r.text,
                createdAt: r.createdAt,
            })),
            ...comments.map((c) => ({
                type: 'comment',
                id: `comment-${c.id}`,
                user: c.user,
                movie: c.movie,
                text: c.text,
                createdAt: c.createdAt,
            })),
            ...watchlistItems.map((w) => ({
                type: 'watchlist',
                id: `watchlist-${w.id}`,
                user: w.user,
                movie: w.movie,
                status: w.status,
                createdAt: w.createdAt,
            })),
        ];

        // Sort by createdAt descending and trim
        feed.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const trimmed = feed.slice(0, limit);

        res.json({ status: 'success', data: trimmed });
    };
}
