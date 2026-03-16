import {z} from 'zod';

const addToWatchListSchema= z.object({
    movieId: z.string().uuid(),
    status: z.enum(["PLANNED", "WATCHING", "COMPLETED", "DROPPED"], {
    error:()=>({
        message: "status must be one of PLANNED, WATCHING, COMPLETED, DROPPED"
    })
    }).optional(),
    rating : z.coerce.number().int("rating must be an integer").min(0, "rating must be at least 0").max(10, "rating must be at most 10").optional(),
    notes: z.string().optional(),
})
export {addToWatchListSchema};