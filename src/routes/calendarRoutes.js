import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
    getGoogleAuthUrl,
    googleOAuthCallback,
    getCalendarStatus,
    syncMovieToCalendar,
} from '../controllers/calendarController.js';

function calendarRoutes(prisma) {
    const router = express.Router();

    router.get('/google/callback', googleOAuthCallback(prisma));

    router.use(authMiddleware);
    router.get('/google/auth-url', getGoogleAuthUrl(prisma));
    router.get('/status', getCalendarStatus(prisma));
    router.post('/sync', syncMovieToCalendar(prisma));

    return router;
}

export default calendarRoutes;
