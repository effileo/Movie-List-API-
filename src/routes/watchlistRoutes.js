import express from 'express';
import { register } from '../controllers/authcontroller.js';
import {login} from '../controllers/authcontroller.js'; 
import {logout} from '../controllers/authcontroller.js';
const router = express.Router();

router.post('/register' , register);
router.post('/login' , login);
router.post('/logout' , logout);
    export default router;     
    