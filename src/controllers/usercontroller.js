/**
 * Public user profile and shared watchlist. Prisma injected from route.
 */
export function getPublicProfile(prisma) {
    return async (req, res) => {
        const id = parseInt(req.params.id, 10);
        if (Number.isNaN(id)) {
            return res.status(400).json({ error: 'Invalid user id' });
        }
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                bio: true,
                avatarUrl: true,
                watchlistPublic: true,
                createdAt: true,
                _count: { select: { watchListItems: true, reviews: true } },
            },
        });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ status: 'success', data: user });
    };
}

/**
 * GET /users/feed/watchlists – list of public watchlists (for Discover feed).
 * Returns users who have watchlistPublic true and at least one watchlist item, with like/comment counts.
 */
export function getWatchlistFeed(prisma) {
    return async (req, res) => {
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
        const users = await prisma.user.findMany({
            where: {
                watchlistPublic: true,
                watchListItems: { some: {} },
            },
            select: {
                id: true,
                name: true,
                avatarUrl: true,
                _count: {
                    select: {
                        watchListItems: true,
                        watchlistLikesRecv: true,
                        watchlistCommentsRecv: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
        const data = users.map((u) => ({
            id: u.id,
            name: u.name,
            avatarUrl: u.avatarUrl,
            movieCount: u._count.watchListItems,
            likeCount: u._count.watchlistLikesRecv,
            commentCount: u._count.watchlistCommentsRecv,
        }));
        res.json({ status: 'success', data });
    };
}

/** GET /users/:id/watchlist – public watchlist if user has watchlistPublic true. */
export function getPublicWatchlist(prisma) {
    return async (req, res) => {
        const id = parseInt(req.params.id, 10);
        if (Number.isNaN(id)) {
            return res.status(400).json({ error: 'Invalid user id' });
        }
        const user = await prisma.user.findUnique({
            where: { id },
            select: { watchlistPublic: true },
        });
        if (!user) return res.status(404).json({ error: 'User not found' });
        if (!user.watchlistPublic) {
            return res.status(403).json({ error: 'This watchlist is private' });
        }
        const items = await prisma.watchListItem.findMany({
            where: { userId: id },
            include: { movie: true },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ status: 'success', data: items });
    };
}

/**
 * GET /users/:id/preview – Lightweight user preview for hover popovers.
 * Returns top 3 highest-rated movies and total movies watched.
 */
export function getUserPreview(prisma) {
    return async (req, res) => {
        const id = parseInt(req.params.id, 10);
        if (Number.isNaN(id)) {
            return res.status(400).json({ error: 'Invalid user id' });
        }
        const user = await prisma.user.findUnique({
            where: { id },
            select: { id: true, name: true, avatarUrl: true, bio: true },
        });
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Top 3 highest-rated movies by this user
        const topReviews = await prisma.review.findMany({
            where: { userId: id },
            orderBy: { rating: 'desc' },
            take: 3,
            include: {
                movie: { select: { id: true, title: true, posterPath: true, tmdbId: true } },
            },
        });

        // Total movies watched (COMPLETED status)
        const totalWatched = await prisma.watchListItem.count({
            where: { userId: id, status: 'COMPLETED' },
        });

        res.json({
            status: 'success',
            data: {
                ...user,
                topMovies: topReviews.map((r) => ({
                    movie: r.movie,
                    rating: r.rating,
                })),
                totalWatched,
            },
        });
    };
}
