import express from 'express';
import { addToWatchList, login, logout } from '../controllers/watchlistController.js';
const router = express.Router();

router.post('/' , addToWatchList);
router.post('/login' , login);
router.post('/logout' , logout);

export default router;     
    