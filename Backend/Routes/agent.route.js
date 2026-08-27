import express from 'express';
import {
  getAgents,
  getAgentById,
  createAgent,
  updateAgent,
  deleteAgent,
  deactivateAgent,
} from '../controller/agent.controller.js';

const router = express.Router();

router.get('/', getAgents);
router.post('/', createAgent);
router.get('/:id', getAgentById);
router.put('/:id', updateAgent);
router.delete('/:id', deleteAgent);
router.patch('/:id/deactivate', deactivateAgent);

export default router;