import express from 'express';
import auth from '../middleware/auth.middleware.js';
import {
  createTask,
  getActivities,
  getTaskById,
  getTasks,
  updateTaskStatus,
} from '../controller/serveai.controller.js';

const router = express.Router();

router.post('/', auth, createTask);

// List tasks (protected)
router.get('/', auth, getTasks);
router.get('/activity', auth, getActivities);
router.get('/:id', auth, getTaskById);
router.patch('/:id/status', auth, updateTaskStatus);

export default router;
