import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
    getCineMatchFriends,
    getCineMatchStack,
    postCineMatchSwipe,
    postCineMatchInvite,
    getCineMatchInvitesPending,
    postCineMatchInviteAccept,
    getCineMatchPartnerStatus,
} from '../controllers/cineMatchController.js';

function cineMatchRoutes(prisma) {
    const router = express.Router();
    router.use(authMiddleware);

    router.get('/friends', getCineMatchFriends(prisma));
    router.get('/stack', getCineMatchStack(prisma));
    router.post('/swipe', postCineMatchSwipe(prisma));

    router.post('/invite', postCineMatchInvite(prisma));
    router.get('/invites/pending', getCineMatchInvitesPending(prisma));
    router.post('/invites/accept/:fromUserId', postCineMatchInviteAccept(prisma));
    router.get('/partner-status/:friendId', getCineMatchPartnerStatus(prisma));

    return router;
}

export default cineMatchRoutes;
