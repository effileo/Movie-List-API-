/**
 * Watchlist handlers receive the Prisma client from the route (dependency injection)
 * so the same connected instance is always used.
 */
const addToWatchList = (prisma) => async (req, res) => {
    if (!prisma?.movie) {
        return res.status(503).json({ error: "Database client not ready" });
    }
    const { movieId, status, rating, notes, } = req.body;
    // verify movie exists in the movie table
    const movieExist = await prisma.movie.findUnique({
    where: {
        id: movieId,
    }
}); 
// if the movie does not exist, return an error response
if (!movieExist){
    return res.status(404).json({
        error: "movie not found"
    });
}

const existingInWatchlist = await prisma.watchListItem.findUnique({
    where: {
        userId_movieId: {
            userId: Number(req.user.id),
            movieId,
        }
    }
});
// check if the movie is already in the user's watchlist
if (existingInWatchlist){
    return res.status(400).json({
        error: "movie already in watchlist."
    })
};
const watchlistItem = await prisma.watchListItem.create({
    data: {
        userId: Number(req.user.id),
        movieId,
        status: status || "PLANNED",
        rating: rating != null && rating !== '' ? Math.round(Number(rating)) : undefined,
        notes,
    }
});
res.status(201).json({
    status: "success",
    data: watchlistItem,
})
}
export {addToWatchList}