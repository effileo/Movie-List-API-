import express from 'express';
import { addToWatchList, deleteFromWatchlist, updateWatchlistItem  } from '../controllers/watchlistcontroller.js';
import authMiddleware from '../middleware/authMiddleware.js';

/**
 * Prisma is passed from server.js so we use the same connected instance.
 * Do not import db.js here - pass prisma from server.
 */
function watchlistRoutes(prisma) {
    const router = express.Router();
    router.use(authMiddleware);

    router.post('/', addToWatchList(prisma));
    router.delete('/:id', deleteFromWatchlist(prisma));
    router.put('/:id', updateWatchlistItem(prisma));
    return router;
}

export default watchlistRoutes;     
    