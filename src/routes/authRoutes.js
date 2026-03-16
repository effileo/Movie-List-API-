import express from 'express';
import { register, login, logout, getMe } from '../controllers/authcontroller.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { registerSchema, loginSchema } from '../validators/authValidators.js';

const router = express.Router();

router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);
router.post('/logout', logout);
router.get('/me', authMiddleware, getMe);

export default router;     
    