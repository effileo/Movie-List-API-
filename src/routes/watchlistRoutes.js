import express from 'express';
import { addToWatchList, deleteFromWatchlist, updateWatchlistItem } from '../controllers/watchlistController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { addToWatchListSchema } from '../validators/watchlistValidators.js';

/**
 * Prisma is passed from server.js so we use the same connected instance.
 * Do not import db.js here - pass prisma from server.
 */
function watchlistRoutes(prisma) {
    const router = express.Router();
    router.use(authMiddleware);

    router.post('/', validateRequest(addToWatchListSchema), addToWatchList(prisma));
    router.delete('/:id', deleteFromWatchlist(prisma));
    router.put('/:id', updateWatchlistItem(prisma));
    return router;
}

export default watchlistRoutes;     
    