import {prisma} from "../config/db"
const addToWatchList= async(req, res) =>{
    const {movieID, status, rating, notes}= req.body
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
}