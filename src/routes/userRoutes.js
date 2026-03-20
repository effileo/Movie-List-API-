import express from 'express';
import { getPublicProfile, getPublicWatchlist, getWatchlistFeed, getUserPreview, toggleFollow, getTopGenres, getNotifications, markNotificationsAsRead, markNotificationRead, respondToFollowRequest } from '../controllers/usercontroller.js';
import { getActivityFeed } from '../controllers/feedcontroller.js';
import {
    listWatchlistComments,
    createWatchlistComment,
    deleteWatchlistComment,
} from '../controllers/watchlistCommentController.js';
import { getWatchlistLikes, toggleWatchlistLike } from '../controllers/watchlistLikeController.js';
import { getRecommendations, getSurpriseMe } from '../controllers/recommendationController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import optionalAuthMiddleware from '../middleware/optionalAuthMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { watchlistCommentSchema } from '../validators/watchlistValidators.js';

function userRoutes(prisma) {
    const router = express.Router();

    /** Global activity feed (must be before /:id) */
    router.get('/feed/activity', getActivityFeed(prisma));

    /** Feed of public watchlists (must be before /:id); optional auth enriches follow state */
    router.get('/feed/watchlists', optionalAuthMiddleware, getWatchlistFeed(prisma));

    /** Discoverable genres for filtering */
    router.get('/discover/genres', getTopGenres(prisma));

    /** Follow/Unfollow & Requests */
    router.post('/:id/follow', authMiddleware, toggleFollow(prisma));
    router.post('/:id/follow/respond', authMiddleware, respondToFollowRequest(prisma));

    /** Notifications */
    router.get('/notifications', authMiddleware, getNotifications(prisma));
    router.patch('/notifications/:notificationId/read', authMiddleware, markNotificationRead(prisma));
    router.post('/notifications/read', authMiddleware, markNotificationsAsRead(prisma));

    /** Watchlist engagement: comments and likes (more specific routes first) */
    router.get('/:id/watchlist/comments', listWatchlistComments(prisma));
    router.post('/:id/watchlist/comments', authMiddleware, validateRequest(watchlistCommentSchema), createWatchlistComment(prisma));
    router.delete('/:id/watchlist/comments/:commentId', authMiddleware, deleteWatchlistComment(prisma));
    router.get('/:id/watchlist/likes', getWatchlistLikes(prisma));
    router.post('/:id/watchlist/like', authMiddleware, toggleWatchlistLike(prisma));

    // Personalized Recommendations ('For You')
    router.get('/me/recommendations', authMiddleware, getRecommendations(prisma));
    router.get('/me/recommendations/surprise', authMiddleware, getSurpriseMe(prisma));

    /** User preview for hover popovers */
    router.get('/:id/preview', getUserPreview(prisma));

    router.get('/:id/watchlist', getPublicWatchlist(prisma));
    router.get('/:id', getPublicProfile(prisma));
    return router;
}

export default userRoutes;
