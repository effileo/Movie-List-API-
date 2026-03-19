import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { getCineMatchFriends, getCineMatchStack, postCineMatchSwipe } from '../controllers/cineMatchController.js';

function cineMatchRoutes(prisma) {
    const router = express.Router();
    router.use(authMiddleware);

    router.get('/friends', getCineMatchFriends(prisma));
    router.get('/stack', getCineMatchStack(prisma));
    router.post('/swipe', postCineMatchSwipe(prisma));

    return router;
}

export default cineMatchRoutes;
