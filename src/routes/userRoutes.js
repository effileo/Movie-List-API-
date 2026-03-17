import express from 'express';
import { getPublicProfile, getPublicWatchlist, getWatchlistFeed } from '../controllers/usercontroller.js';
import {
    listWatchlistComments,
    createWatchlistComment,
    deleteWatchlistComment,
} from '../controllers/watchlistCommentController.js';
import { getWatchlistLikes, toggleWatchlistLike } from '../controllers/watchlistLikeController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { watchlistCommentSchema } from '../validators/watchlistValidators.js';

function userRoutes(prisma) {
    const router = express.Router();

    /** Feed of public watchlists (must be before /:id) */
    router.get('/feed/watchlists', getWatchlistFeed(prisma));

    /** Watchlist engagement: comments and likes (more specific routes first) */
    router.get('/:id/watchlist/comments', listWatchlistComments(prisma));
    router.post('/:id/watchlist/comments', authMiddleware, validateRequest(watchlistCommentSchema), createWatchlistComment(prisma));
    router.delete('/:id/watchlist/comments/:commentId', authMiddleware, deleteWatchlistComment(prisma));
    router.get('/:id/watchlist/likes', getWatchlistLikes(prisma));
    router.post('/:id/watchlist/like', authMiddleware, toggleWatchlistLike(prisma));

    router.get('/:id/watchlist', getPublicWatchlist(prisma));
    router.get('/:id', getPublicProfile(prisma));
    return router;
}

export default userRoutes;
