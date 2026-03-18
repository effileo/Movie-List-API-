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
                watchListItems: {
                    take: 3,
                    orderBy: { createdAt: 'desc' },
                    include: { movie: { select: { posterPath: true, title: true } } },
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
            previewMovies: u.watchListItems.map((item) => ({
                posterPath: item.movie.posterPath,
                title: item.movie.title,
            })),
        }));
        res.json({ status: 'success', data });
    };
}

/**
 * POST /users/:id/follow – Follow/unfollow a user.
 */
export function toggleFollow(prisma) {
    return async (req, res) => {
        const followerId = req.user.id;
        const followedId = parseInt(req.params.id, 10);
        if (Number.isNaN(followedId)) return res.status(400).json({ error: 'Invalid user id' });
        if (followerId === followedId) return res.status(400).json({ error: 'Cannot follow yourself' });

        const existing = await prisma.follow.findUnique({
            where: { followerId_followedId: { followerId, followedId } },
        });

        if (existing) {
            await prisma.follow.delete({
                where: { followerId_followedId: { followerId, followedId } },
            });
            return res.json({ status: 'success', followed: false });
        } else {
            await prisma.follow.create({
                data: { followerId, followedId },
            });
            return res.json({ status: 'success', followed: true });
        }
    };
}

/**
 * GET /users/discover/genres – Aggregates most common genres from public watchlists.
 */
export function getTopGenres(prisma) {
    return async (req, res) => {
        const publicMovies = await prisma.watchListItem.findMany({
            where: { user: { watchlistPublic: true } },
            include: { movie: { select: { genre: true } } },
        });

        const genreCounts = {};
        publicMovies.forEach((item) => {
            item.movie.genre.forEach((g) => {
                genreCounts[g] = (genreCounts[g] || 0) + 1;
            });
        });

        const sortedGenres = Object.entries(genreCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([genre]) => genre);

        res.json({ status: 'success', data: sortedGenres });
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
