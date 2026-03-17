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
