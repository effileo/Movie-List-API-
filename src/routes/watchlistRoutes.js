import express from 'express';
import { addToWatchList, deleteFromWatchlist, updateWatchlistItem, getMyWatchlist, cloneWatchlist } from '../controllers/watchlistcontroller.js';
import { getVaultData } from '../controllers/vaultController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { addToWatchListSchema } from '../validators/watchlistValidators.js';

/**
 * Prisma is passed from server.js so we use the same connected instance.
 */
function watchlistRoutes(prisma) {
    const router = express.Router();
    router.use(authMiddleware);

    router.get('/vault', getVaultData(prisma));
    router.get('/', getMyWatchlist(prisma));
    router.post('/', validateRequest(addToWatchListSchema), addToWatchList(prisma));
    router.post('/clone/:targetUserId', cloneWatchlist(prisma));
    router.delete('/:id', deleteFromWatchlist(prisma));
    router.put('/:id', updateWatchlistItem(prisma));
    return router;
}

export default watchlistRoutes;     
    