/**
 * Comments on movies. Prisma from route.
 */
export function listCommentsByMovie(prisma) {
    return async (req, res) => {
        const { id: movieId } = req.params;
        const comments = await prisma.comment.findMany({
            where: { movieId },
            include: { user: { select: { id: true, name: true, avatarUrl: true } } },
            orderBy: { createdAt: 'asc' },
        });
        res.json({ status: 'success', data: comments });
    };
}

export function createComment(prisma) {
    return async (req, res) => {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Not authorized' });
        const { id: movieId } = req.params;
        const { text } = req.body;
        const movie = await prisma.movie.findUnique({ where: { id: movieId } });
        if (!movie) return res.status(404).json({ error: 'Movie not found' });
        const comment = await prisma.comment.create({
            data: { userId, movieId, text },
            include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        });
        res.status(201).json({ status: 'success', data: comment });
    };
}

export function deleteComment(prisma) {
    return async (req, res) => {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Not authorized' });
        const comment = await prisma.comment.findUnique({
            where: { id: req.params.id },
        });
        if (!comment) return res.status(404).json({ error: 'Comment not found' });
        if (comment.userId !== userId) return res.status(403).json({ error: 'Forbidden' });
        await prisma.comment.delete({ where: { id: req.params.id } });
        res.status(204).send();
    };
}
