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
        const me = req.user?.id != null ? Number(req.user.id) : null;
        const hasMe = me != null && !Number.isNaN(me);

        const select = {
            id: true,
            name: true,
            avatarUrl: true,
            watchlistPublic: true,
            updatedAt: true,
            _count: {
                select: {
                    watchListItems: true,
                    watchlistLikesRecv: true,
                    watchlistCommentsRecv: true,
                },
            },
            watchListItems: {
                take: 4,
                orderBy: { createdAt: 'desc' },
                include: { movie: { select: { posterPath: true, title: true, genre: true } } },
            },
        };
        if (hasMe) {
            /** I follow this user (followerId = me, followedId = card user) */
            select.followers = {
                where: { followerId: me },
                select: { status: true },
                take: 1,
            };
            /** This user follows me (followerId = card user, followedId = me) */
            select.following = {
                where: { followedId: me },
                select: { status: true },
                take: 1,
            };
        }

        const users = await prisma.user.findMany({
            where: {
                watchlistPublic: true,
                watchListItems: { some: {} },
            },
            select,
            orderBy: { updatedAt: 'desc' },
            take: limit,
        });
        const data = users.map((u) => {
            const myFollow = hasMe && u.followers?.[0]?.status != null ? u.followers[0].status : null;
            const theirFollow = hasMe && u.following?.[0]?.status != null ? u.following[0].status : null;
            const isFriend = myFollow === 'ACCEPTED' && theirFollow === 'ACCEPTED';
            return {
                id: u.id,
                name: u.name,
                avatarUrl: u.avatarUrl,
                followStatus: myFollow,
                isFriend,
                movieCount: u._count.watchListItems,
                likeCount: u._count.watchlistLikesRecv,
                commentCount: u._count.watchlistCommentsRecv,
                updatedAt: u.updatedAt?.toISOString?.() ?? null,
                previewMovies: u.watchListItems.map((item) => ({
                    posterPath: item.movie.posterPath,
                    title: item.movie.title,
                    genre: item.movie.genre,
                })),
            };
        });
        res.json({ status: 'success', data });
    };
}

/**
 * POST /users/:id/follow – Request to follow a user (creates PENDING follow + notification).
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
            // If already exists (pending or accepted), we unfollow/cancel
            await prisma.follow.delete({
                where: { followerId_followedId: { followerId, followedId } },
            });
            // Also delete the notification if it was still pending
            await prisma.notification.deleteMany({
                where: { userId: followedId, fromUserId: followerId, type: 'FOLLOW_REQUEST' }
            });
            return res.json({ status: 'success', followed: false, statusText: 'unfollowed' });
        } else {
            // Create a pending follow request
            await prisma.follow.create({
                data: { followerId, followedId, status: 'PENDING' },
            });
            // Create notification for the followed user
            await prisma.notification.create({
                data: {
                    userId: followedId,
                    fromUserId: followerId,
                    type: 'FOLLOW_REQUEST',
                    message: `${req.user.name} requested to follow you.`,
                }
            });
            return res.json({ status: 'success', followed: true, statusText: 'pending' });
        }
    };
}

/**
 * POST /users/:id/follow/respond – Accept or decline a follow request.
 */
export function respondToFollowRequest(prisma) {
    return async (req, res) => {
        const userId = req.user.id; // The person being followed
        const requesterId = parseInt(req.params.id, 10);
        const { action } = req.body; // 'accept' or 'decline'

        if (action === 'accept') {
            await prisma.follow.update({
                where: { followerId_followedId: { followerId: requesterId, followedId: userId } },
                data: { status: 'ACCEPTED' },
            });
            // Notify the requester that they were accepted
            await prisma.notification.create({
                data: {
                    userId: requesterId,
                    fromUserId: userId,
                    type: 'FOLLOW_ACCEPTED',
                    message: `${req.user.name} accepted your follow request.`,
                }
            });
        } else {
            await prisma.follow.delete({
                where: { followerId_followedId: { followerId: requesterId, followedId: userId } },
            });
        }

        // Mark the original request notification as read
        await prisma.notification.updateMany({
            where: { userId, fromUserId: requesterId, type: 'FOLLOW_REQUEST' },
            data: { isRead: true }
        });

        res.json({ status: 'success', action });
    };
}

/**
 * GET /users/notifications – Fetch unread notifications for the current user.
 */
export function getNotifications(prisma) {
    return async (req, res) => {
        try {
            const userId = req.user.id;
            const notifications = await prisma.notification.findMany({
                where: { userId, isRead: false },
                orderBy: { createdAt: 'desc' },
                include: {
                    // Include requester info for follow requests
                    fromUser: { select: { name: true, avatarUrl: true } }
                }
            });
            res.json({ status: 'success', data: notifications });
        } catch (err) {
            console.error('getNotifications ERROR:', err.message);
            console.error(err.stack);
            res.status(500).json({ error: err.message });
        }
    };
}

/**
 * POST /users/notifications/read – Mark all notifications for the user as read.
 */
export function markNotificationsAsRead(prisma) {
    return async (req, res) => {
        const userId = req.user.id;
        await prisma.notification.updateMany({
            where: { userId },
            data: { isRead: true },
        });
        res.json({ status: 'success' });
    };
}

/**
 * PATCH /users/notifications/:notificationId/read – Mark a single notification as read.
 */
export function markNotificationRead(prisma) {
    return async (req, res) => {
        try {
            const userId = req.user.id;
            const { notificationId } = req.params;
            const n = await prisma.notification.updateMany({
                where: { id: notificationId, userId },
                data: { isRead: true },
            });
            if (n.count === 0) {
                return res.status(404).json({ error: 'Notification not found' });
            }
            res.json({ status: 'success' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to update notification' });
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
            if (item.movie?.genre) {
                item.movie.genre.forEach((g) => {
                    genreCounts[g] = (genreCounts[g] || 0) + 1;
                });
            }
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
