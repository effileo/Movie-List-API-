/**
 * Comments on a user's public watchlist. targetUserId = the user whose watchlist is commented on.
 */
export function listWatchlistComments(prisma) {
    return async (req, res) => {
        const targetUserId = parseInt(req.params.id, 10);
        if (Number.isNaN(targetUserId)) {
            return res.status(400).json({ error: 'Invalid user id' });
        }
        const comments = await prisma.watchlistComment.findMany({
            where: { targetUserId },
            include: { user: { select: { id: true, name: true, avatarUrl: true } } },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ status: 'success', data: comments });
    };
}

export function createWatchlistComment(prisma) {
    return async (req, res) => {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Not authorized' });
        const targetUserId = parseInt(req.params.id, 10);
        if (Number.isNaN(targetUserId)) {
            return res.status(400).json({ error: 'Invalid user id' });
        }
        const { text } = req.body;
        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { watchlistPublic: true },
        });
        if (!targetUser) return res.status(404).json({ error: 'User not found' });
        if (!targetUser.watchlistPublic) return res.status(403).json({ error: 'This watchlist is private' });
        if (userId === targetUserId) return res.status(400).json({ error: 'You cannot comment on your own watchlist' });
        const comment = await prisma.watchlistComment.create({
            data: { userId, targetUserId, text },
            include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        });

        // Notify the target user
        await prisma.notification.create({
            data: {
                userId: targetUserId,
                fromUserId: userId,
                type: 'COMMENT_WATCHLIST',
                message: `${req.user.name} commented on your watchlist!`,
            }
        });

        res.status(201).json({ status: 'success', data: comment });
    };
}

export function deleteWatchlistComment(prisma) {
    return async (req, res) => {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Not authorized' });
        const comment = await prisma.watchlistComment.findUnique({
            where: { id: req.params.commentId },
        });
        if (!comment) return res.status(404).json({ error: 'Comment not found' });
        if (comment.userId !== userId) return res.status(403).json({ error: 'Forbidden' });
        await prisma.watchlistComment.delete({ where: { id: req.params.commentId } });
        res.status(204).send();
    };
}
