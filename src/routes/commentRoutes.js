import express from 'express';
import { deleteComment } from '../controllers/commentcontroller.js';
import authMiddleware from '../middleware/authMiddleware.js';

function commentRoutes(prisma) {
    const router = express.Router();
    router.delete('/:id', authMiddleware, deleteComment(prisma));
    return router;
}

export default commentRoutes;
