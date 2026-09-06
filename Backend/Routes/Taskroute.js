import express from 'express';
import Task from '../models/Task.js';
import auth from '../middleware/auth.middleware.js';

const router = express.Router();

// Create a new task (protected)
router.post('/', auth, async (req, res) => {
  try {
    const { agentId, type, input, title, priority, tags } = req.body;
    const userId = req.userId;

    if (!agentId || !type || !input || !title) {
      return res.status(400).json({ error: 'agentId, type, input, and title are required' });
    }

    const task = await Task.create({
      title,
      agentId,
      userId,
      type,
      input,
      priority: priority || 'normal',
      tags: tags || [],
    });

    return res.status(201).json(task);
  } catch (error) {
    console.error('Task create error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// List tasks (protected)
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const tasks = await Task.find({ userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .exec();

    const total = await Task.countDocuments({ userId });

    return res.json({ tasks, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    console.error('Task list error:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
