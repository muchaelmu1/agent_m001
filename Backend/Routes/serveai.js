import express from 'express';
import {
  getAgents,
  createTask,
  getTasks,
  getTaskById,
  updateTaskStatus,
  getTaskStats,
} from '../controller/serveai.controller.js';

const router = express.Router();

// Agent endpoints
router.get('/agents', getAgents);

// Task endpoints
router.post('/tasks', createTask);
router.get('/tasks', getTasks);
router.get('/tasks/stats', getTaskStats);
router.get('/tasks/:id', getTaskById);
router.put('/tasks/:id', updateTaskStatus);

export default router;

