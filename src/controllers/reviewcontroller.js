/**
 * Reviews: one per user per movie (rating + optional text). Prisma from route.
 */
export function listReviewsByMovie(prisma) {
    return async (req, res) => {
        const { id: movieId } = req.params;
        const reviews = await prisma.review.findMany({
            where: { movieId },
            include: { user: { select: { id: true, name: true, avatarUrl: true } } },
            orderBy: { createdAt: 'desc' },
        });
        const agg = await prisma.review.aggregate({
            where: { movieId },
            _avg: { rating: true },
            _count: true,
        });

        // Rating distribution: count per rating 1–10
        const distRaw = await prisma.review.groupBy({
            by: ['rating'],
            where: { movieId },
            _count: true,
        });
        const distribution = Array.from({ length: 10 }, (_, i) => {
            const entry = distRaw.find((d) => d.rating === i + 1);
            return { rating: i + 1, count: entry?._count ?? 0 };
        });

        res.json({
            status: 'success',
            data: reviews,
            aggregate: { averageRating: agg._avg.rating ?? null, count: agg._count },
            distribution,
        });
    };
}

export function createOrUpdateReview(prisma) {
    return async (req, res) => {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Not authorized' });
        const { id: movieId } = req.params;
        const { rating, text } = req.body;
        const movie = await prisma.movie.findUnique({ where: { id: movieId } });
        if (!movie) return res.status(404).json({ error: 'Movie not found' });
        const review = await prisma.review.upsert({
            where: {
                userId_movieId: { userId, movieId },
            },
            create: { userId, movieId, rating, text: text ?? null },
            update: { rating, text: text ?? null },
            include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        });
        res.status(201).json({ status: 'success', data: review });
    };
}

export function deleteReview(prisma) {
    return async (req, res) => {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Not authorized' });
        const review = await prisma.review.findUnique({
            where: { id: req.params.id },
        });
        if (!review) return res.status(404).json({ error: 'Review not found' });
        if (review.userId !== userId) return res.status(403).json({ error: 'Forbidden' });
        await prisma.review.delete({ where: { id: req.params.id } });
        res.status(204).send();
    };
}
