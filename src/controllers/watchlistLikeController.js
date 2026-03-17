/**
 * Likes on a user's public watchlist. targetUserId = the user whose watchlist is liked.
 */
export function getWatchlistLikes(prisma) {
    return async (req, res) => {
        const targetUserId = parseInt(req.params.id, 10);
        if (Number.isNaN(targetUserId)) {
            return res.status(400).json({ error: 'Invalid user id' });
        }
        const count = await prisma.watchlistLike.count({
            where: { targetUserId },
        });
        const currentUserId = req.user?.id;
        let likedByMe = false;
        if (currentUserId) {
            const like = await prisma.watchlistLike.findUnique({
                where: {
                    userId_targetUserId: { userId: currentUserId, targetUserId },
                },
            });
            likedByMe = !!like;
        }
        res.json({ status: 'success', data: { likeCount: count, likedByMe } });
    };
}

export function toggleWatchlistLike(prisma) {
    return async (req, res) => {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Not authorized' });
        const targetUserId = parseInt(req.params.id, 10);
        if (Number.isNaN(targetUserId)) {
            return res.status(400).json({ error: 'Invalid user id' });
        }
        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { watchlistPublic: true },
        });
        if (!targetUser) return res.status(404).json({ error: 'User not found' });
        if (!targetUser.watchlistPublic) return res.status(403).json({ error: 'This watchlist is private' });
        if (userId === targetUserId) return res.status(400).json({ error: 'You cannot like your own watchlist' });

        const existing = await prisma.watchlistLike.findUnique({
            where: {
                userId_targetUserId: { userId, targetUserId },
            },
        });
        if (existing) {
            await prisma.watchlistLike.delete({
                where: {
                    userId_targetUserId: { userId, targetUserId },
                },
            });
            return res.json({ status: 'success', data: { liked: false, likeCount: await prisma.watchlistLike.count({ where: { targetUserId } }) } });
        }
        await prisma.watchlistLike.create({
            data: { userId, targetUserId },
        });
        const likeCount = await prisma.watchlistLike.count({ where: { targetUserId } });
        return res.json({ status: 'success', data: { liked: true, likeCount } });
    };
}
