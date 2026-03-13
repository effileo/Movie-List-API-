import {prisma} from "../config/db"
const addToWatchList= async(req, res) =>{
    const {movieID, status, rating, notes}= req.body
// verify movie exist in the movie table
const movieExist = await prisma.movie.findUnique({
    where: {
        id: movieID,
    }
})
}