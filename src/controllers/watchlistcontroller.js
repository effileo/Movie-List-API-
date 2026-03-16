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
})
}
export { addToWatchList, deleteFromWatchlist, updateWatchlistItem };