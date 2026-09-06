import express from 'express';
import auth from '../middleware/auth.middleware.js';

const router = express.Router();

// Basic health endpoint for serveai
router.get('/', (req, res) => {
  res.json({ message: 'hello from serveai router' });
});

export default router;
