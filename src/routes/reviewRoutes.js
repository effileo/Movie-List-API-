import express from 'express';
import { deleteReview } from '../controllers/reviewcontroller.js';
import authMiddleware from '../middleware/authMiddleware.js';

function reviewRoutes(prisma) {
    const router = express.Router();
    router.delete('/:id', authMiddleware, deleteReview(prisma));
    return router;
}

export default reviewRoutes;
