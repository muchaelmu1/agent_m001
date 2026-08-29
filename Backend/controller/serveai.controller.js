// Backend/controller/serveai.controller.js
import Task from "../models/Task.js";
import Agent from "../models/Agent.model.js";
import Activity from "../models/Activity.model.js";
import { OpenAI } from "openai";
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.openai_key,
});

// Get all active agents
export const getAgents = async (req, res) => {
  try {
    const agents = await Agent.find({
      status: "active",
      createdBy: req.userId,
    }).select("name role description capabilities");

    res.status(200).json({
      success: true,
      data: agents,
    });
  } catch (error) {
    console.error("Get agents error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Create a new task
export const createTask = async (req, res) => {
  try {
    const { agentId, type, input, priority, title, tags } = req.body;
    const userId = req.userId;

    // Validate input
    if (!agentId || !type || !input || !title) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: agentId, type, input, title",
      });
    }

    // Verify agent exists and belongs to user
    const agent = await Agent.findById(agentId);
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: "Agent not found",
      });
    }

    if (agent.createdBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: "You don't have permission to use this agent",
      });
    }

    // Check agent status
    if (agent.status !== "active") {
      return res.status(400).json({
        success: false,
        error: "Agent is not active",
      });
    }

    // Create task
    const task = await Task.create({
      title,
      agentId,
      userId,
      type,
      input,
      priority: priority || "normal",
      tags: tags || [],
    });

    // Process task asynchronously
    processTaskWithAI(task._id, agentId, userId, type, input, title, agent);

    return res.status(201).json({
      success: true,
      data: task,
      message: "Task created and queued for processing",
    });
  } catch (error) {
    console.error("Create task error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get all tasks
export const getTasks = async (req, res) => {
  try {
    const {
      agentId,
      status,
      priority,
      page = 1,
      limit = 10,
    } = req.query;
    const userId = req.userId;

    let query = { userId };
    if (agentId) query.agentId = agentId;
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const tasks = await Task.find(query)
      .populate("agentId", "name role")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Task.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: tasks,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get tasks error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get single task by ID
export const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const task = await Task.findById(id)
      .populate("agentId", "name role instructions")
      .populate("userId", "username email");

    if (!task) {
      return res.status(404).json({
        success: false,
        error: "Task not found",
      });
    }

    // Check if user owns this task
    if (task.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: "You don't have permission to view this task",
      });
    }

    // Get related activities
    const activities = await Activity.find({ taskId: id }).sort({
      timestamp: -1,
    });

    return res.status(200).json({
      success: true,
      data: {
        ...task.toObject(),
        activities,
      },
    });
  } catch (error) {
    console.error("Get task by ID error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Update task status
export const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, result, requiresHuman, message } = req.body;
    const userId = req.userId;

    // Validate status
    const validStatuses = ["received", "working", "resolved", "escalated", "failed"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: "Task not found",
      });
    }

    // Check if user owns this task
    if (task.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: "You don't have permission to update this task",
      });
    }

    // Update task
    if (status) task.status = status;
    if (result) task.result = result;
    if (requiresHuman !== undefined) task.requiresHuman = requiresHuman;
    if (status === "working" && !task.startedAt) task.startedAt = new Date();
    if (
      (status === "resolved" || status === "escalated" || status === "failed") &&
      !task.completedAt
    ) {
      task.completedAt = new Date();
      task.processingTime =
        task.completedAt - task.startedAt;
    }
    task.updatedAt = new Date();

    await task.save();

    // Log activity
    if (message) {
      await Activity.create({
        agentId: task.agentId,
        taskId: id,
        userId,
        action: "status_update",
        status: status || "pending",
        message,
      });
    }

    return res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error("Update task status error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get task analytics/stats
export const getTaskStats = async (req, res) => {
  try {
    const { agentId } = req.query;
    const userId = req.userId;

    let query = { userId };
    if (agentId) query.agentId = agentId;

    const stats = await Task.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          avgProcessingTime: { $avg: "$processingTime" },
        },
      },
    ]);

    const priorityStats = await Task.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
        },
      },
    ]);

    const formattedStats = {
      total: 0,
      byStatus: {},
      byPriority: {},
      avgProcessingTime: 0,
    };

    stats.forEach((stat) => {
      formattedStats.byStatus[stat._id] = {
        count: stat.count,
        avgTime: Math.round(stat.avgProcessingTime || 0),
      };
      formattedStats.total += stat.count;
    });

    priorityStats.forEach((stat) => {
      formattedStats.byPriority[stat._id] = stat.count;
    });

    return res.status(200).json({
      success: true,
      data: formattedStats,
    });
  } catch (error) {
    console.error("Get task stats error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Helper function to process task with AI
async function processTaskWithAI(taskId, agentId, userId, type, input, title, agent) {
  try {
    // Update task status to "working"
    await Task.findByIdAndUpdate(taskId, {
      status: "working",
      startedAt: new Date(),
    });

    // Log activity
    await Activity.create({
      agentId,
      taskId,
      userId,
      action: "started",
      status: "processing",
      message: `Task "${title}" started processing`,
    });

    // Create AI prompt
    const systemPrompt =
      agent.instructions ||
      `You are a helpful AI agent with role: ${agent.role}. Capabilities: ${agent.capabilities.join(
        ", "
      )}`;
    const userMessage =
      typeof input === "string" ? input : JSON.stringify(input);

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: agent.model,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      temperature: agent.temperature,
      max_tokens: agent.maxTokens,
    });

    const aiResponse = response.choices[0].message.content;

    // Determine if human escalation is needed
    const requiresHuman =
      aiResponse.toLowerCase().includes("escalate") ||
      aiResponse.toLowerCase().includes("human") ||
      aiResponse.toLowerCase().includes("manual");

    // Update task with result
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      {
        result: aiResponse,
        status: requiresHuman ? "escalated" : "resolved",
        requiresHuman,
        completedAt: new Date(),
      },
      { new: true }
    );

    // Update agent stats
    await Agent.findByIdAndUpdate(
      agentId,
      {
        $inc: { "stats.tasksCompleted": 1 },
      }
    );

    // Log activity
    await Activity.create({
      agentId,
      taskId,
      userId,
      action: requiresHuman ? "escalated" : "completed",
      status: "success",
      message: aiResponse.substring(0, 500),
    });

    console.log(
      `✅ Task ${taskId} processed successfully. Status: ${
        requiresHuman ? "escalated" : "resolved"
      }`
    );
  } catch (error) {
    console.error("❌ Error processing task with AI:", error);

    // Update task status to "failed"
    await Task.findByIdAndUpdate(taskId, {
      status: "failed",
      result: error.message,
      completedAt: new Date(),
    });

    // Update agent stats
    await Agent.findByIdAndUpdate(agentId, {
      $inc: { "stats.tasksFailed": 1 },
    });

    // Log error activity
    await Activity.create({
      agentId,
      taskId,
      userId,
      action: "error",
      status: "failed",
      message: `Error processing task: ${error.message}`,
    });
  }
}