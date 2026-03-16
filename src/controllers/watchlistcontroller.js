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

export { addToWatchList, deleteFromWatchlist, updateWatchlistItem, getMyWatchlist };