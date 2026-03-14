import {prisma} from "../config/db"
const addToWatchList= async(req, res) =>{
    const {movieID, status, rating, notes, userId}= req.body
// verify movie exist in the movie table
const movieExist = await prisma.movie.findUnique({
    where: {
        id: movieID,
    }
}); 
if (!movieExist){
    return res.status(404).json({
        error: "movie not found"
    });
}
const existingInWatchlist = await prisma.watchlistItem.findUnique({
    where: {
        userId_movieId: {
            userId: userId,
            movieId: movieID,
        }
    }
});
if (existingInWatchlist){
    return res.status(400).json({
        error: "movie already in watchlist."
    })
};
const watchlistItem = await prisma.watchlistItem.create({
    data:{
        userId,
        movieId: movieId,
        status: status || "PLANNED",
    }
});
res.status(201).json({
    status: "success",
    data: watchlistItem,
})
}
export {addToWatchList}