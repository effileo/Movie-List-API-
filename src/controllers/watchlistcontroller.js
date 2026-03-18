import { getOrCreateMovieByTmdbId } from './moviecontroller.js';

/**
 * Watchlist handlers receive the Prisma client from the route (dependency injection).
 * Body: either movieId (our DB uuid) or tmdbId (TMDB id). If tmdbId, we find-or-create the movie in our DB first.
 */
const addToWatchList = (prisma) => async (req, res) => {
    if (!prisma?.movie) {
        return res.status(503).json({ error: "Database client not ready" });
    }
    const { movieId: bodyMovieId, tmdbId, status, rating, notes } = req.body;
    let movieId = bodyMovieId;

    if (tmdbId != null) {
        try {
            const { movie } = await getOrCreateMovieByTmdbId(prisma, tmdbId, req.user.id);
            if (!movie) {
                return res.status(404).json({ error: "Movie not found on TMDB" });
            }
            movieId = movie.id;
        } catch (err) {
            if (err.message?.startsWith('TMDB API error 404')) {
                return res.status(404).json({ error: "Movie not found on TMDB" });
            }
            console.error(err);
            return res.status(502).json({ error: "Failed to get movie from TMDB" });
        }
    } else {
        const movieExist = await prisma.movie.findUnique({
            where: { id: movieId },
        });
        if (!movieExist) {
            return res.status(404).json({ error: "movie not found" });
        }
    }

    const existingInWatchlist = await prisma.watchListItem.findUnique({
        where: {
            userId_movieId: {
                userId: Number(req.user.id),
                movieId,
            },
        },
    });
    if (existingInWatchlist) {
        return res.status(400).json({ error: "movie already in watchlist." });
    }

    const watchlistItem = await prisma.watchListItem.create({
        data: {
            userId: Number(req.user.id),
            movieId,
            status: status || "PLANNED",
            rating: rating != null && rating !== '' ? Math.round(Number(rating)) : undefined,
            notes,
        },
    });
    return res.status(201).json({ status: "success", data: watchlistItem });
};
const deleteFromWatchlist = (prisma) => async (req, res) => {
    const watchlistItem = await prisma.watchListItem.findUnique({
        where: { id: req.params.id }
    });
    if (!watchlistItem) {
        return res.status(404).json({ error: "watchlist item not found" });
    }
    if (watchlistItem.userId !== Number(req.user.id)) {
        return res.status(403).json({ error: "you are forbidden to change this item" });
    }
    await prisma.watchListItem.delete({
        where: { id: req.params.id }
    });
    return res.status(200).json({
        status: "success",
        message: "item deleted successfully"
    })
};

const updateWatchlistItem = (prisma) => async (req, res) => {
    const watchlistItem = await prisma.watchListItem.findUnique({
        where: { id: req.params.id }
    });
if (!watchlistItem) {
    return res.status(404).json({ error: "watchlist item not found" });
}           
if (watchlistItem.userId !== Number(req.user.id)) {
    return res.status(403).json({ error: "you are forbidden to change this item" });
}   
const { status, rating, notes } = req.body;     
const updatedItem = await prisma.watchListItem.update({
    where: { id: req.params.id },
    data: {
        status,
        rating: rating != null && rating !== '' ? Math.round(Number(rating)) : undefined,
        notes,
    }
});
return res.status(200).json({
    status: "success",
    data: updatedItem,
});
};

/** GET my watchlist – all items for the current user with movie details (auth required). */
const getMyWatchlist = (prisma) => async (req, res) => {
    const userId = Number(req.user.id);
    const items = await prisma.watchListItem.findMany({
        where: { userId },
        include: { movie: true },
        orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json({ status: 'success', data: items });
};


/**
 * POST /watchlist/clone/:targetUserId – Copies all movies from target user's public watchlist.
 */
const cloneWatchlist = (prisma) => async (req, res) => {
    const userId = Number(req.user.id);
    const targetUserId = parseInt(req.params.targetUserId, 10);

    if (Number.isNaN(targetUserId)) return res.status(400).json({ error: 'Invalid user id' });
    if (userId === targetUserId) return res.status(400).json({ error: 'Cannot clone your own watchlist' });

    // Ensure target user has a public watchlist
    const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { watchlistPublic: true },
    });

    if (!targetUser || !targetUser.watchlistPublic) {
        return res.status(403).json({ error: 'Target watchlist is private or user not found' });
    }

    // Get all movies from target user
    const targetItems = await prisma.watchListItem.findMany({
        where: { userId: targetUserId },
        select: { movieId: true },
    });

    if (targetItems.length === 0) {
        return res.status(400).json({ error: 'Target watchlist is empty' });
    }

    // Get current user's movie IDs to avoid duplicates
    const myItems = await prisma.watchListItem.findMany({
        where: { userId },
        select: { movieId: true },
    });
    const myMovieIds = new Set(myItems.map((i) => i.movieId));

    // Filter out movies already in our watchlist
    const newItemsData = targetItems
        .filter((item) => !myMovieIds.has(item.movieId))
        .map((item) => ({
            userId,
            movieId: item.movieId,
            status: 'PLANNED',
        }));

    if (newItemsData.length === 0) {
        return res.json({ status: 'success', message: 'All movies are already in your watchlist' });
    }

    // Bulk create
    await prisma.watchListItem.createMany({
        data: newItemsData,
        skipDuplicates: true,
    });

    return res.status(201).json({ status: 'success', clonedCount: newItemsData.length });
};

export { addToWatchList, deleteFromWatchlist, updateWatchlistItem, getMyWatchlist, cloneWatchlist };