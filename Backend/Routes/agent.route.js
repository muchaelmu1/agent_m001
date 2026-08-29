// Backend/Routes/agent.route.js
import express from "express";
import {
  getAgents,
  getAgentById,
  createAgent,
  updateAgent,
  deleteAgent,
  deactivateAgent,
  getAgentStats,
} from "../controller/agent.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

router.get("/", getAgents);
router.post("/", createAgent);
router.get("/:id", getAgentById);
router.put("/:id", updateAgent);
router.delete("/:id", deleteAgent);
router.patch("/:id/deactivate", deactivateAgent);
router.get("/:id/stats", getAgentStats);

export default router;