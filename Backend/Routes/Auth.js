import express from 'express';
import { getCurrentUser, signin, signup } from '../controller/Auth.controller.js';
import auth from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/signin', signin);
router.get('/me', auth, getCurrentUser);

export default router;
