import express from 'express';
import { getCurrentUser, getTeam, inviteTeamMember, removeTeamMember, signin, signup } from '../controller/Auth.controller.js';
import auth from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/signin', signin);
router.get('/me', auth, getCurrentUser);
router.get('/team', auth, getTeam);
router.post('/team', auth, inviteTeamMember);
router.delete('/team/:memberId', auth, removeTeamMember);

export default router;
