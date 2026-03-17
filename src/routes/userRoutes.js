import express from 'express';
import { getPublicProfile, getPublicWatchlist } from '../controllers/usercontroller.js';

function userRoutes(prisma) {
    const router = express.Router();
    router.get('/:id/watchlist', getPublicWatchlist(prisma));
    router.get('/:id', getPublicProfile(prisma));
    return router;
}

export default userRoutes;
