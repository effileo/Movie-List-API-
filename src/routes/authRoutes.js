import express from 'express';
import { register, login, logout, getMe, updateProfile } from '../controllers/authcontroller.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { registerSchema, loginSchema } from '../validators/authValidators.js';
import { updateProfileSchema } from '../validators/profileValidators.js';

const router = express.Router();

router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);
router.post('/logout', logout);
router.get('/me', authMiddleware, getMe);
router.patch('/me', authMiddleware, validateRequest(updateProfileSchema), updateProfile);

export default router;     
    