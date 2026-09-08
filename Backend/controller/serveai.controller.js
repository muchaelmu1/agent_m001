// Backend/controller/serveai.controller.js
import Task from "../models/Task.js";
import Agent from "../models/Agent.model.js";
import Activity from "../models/Activity.model.js";
import OpenAI from "openai";
import dotenv from 'dotenv';

dotenv.config();

const groqKey = process.env.GROQ_API_KEY || process.env.groq_api_key;
let groq = null;
if (groqKey) {
  groq = new OpenAI({
    apiKey: groqKey,
    baseURL: "https://api.groq.com/openai/v1",
  });
}

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

    if (!agentId || !type || !input || !title) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: agentId, type, input, title",
      });
    }

    const agent = await Agent.findById(agentId);
    if (!agent) {
      return res.status(404).json({ success: false, error: "Agent not found" });
    }

    if (agent.createdBy && agent.createdBy.toString() !== userId) {
      return res.status(403).json({ success: false, error: "You don't have permission to use this agent" });
    }

    if (agent.status !== "active") {
      return res.status(400).json({ success: false, error: "Agent is not active" });
    }

    const task = await Task.create({
      title,
      agentId,
      userId,
      type,
      input,
      priority: priority || "normal",
      tags: tags || [],
    });

    void Activity.create({
      agentId,
      taskId: task._id,
      userId,
      action: "created",
      status: "pending",
      message: `Task "${title}" created and queued`,
    }).catch((activityError) => console.error("Create task activity error:", activityError));

    // Always process through the AI worker so missing configuration becomes a visible failed task.
    processTaskWithAI(task._id, agentId, userId, type, input, title, agent);

    return res.status(201).json({ success: true, data: task, message: "Task created and queued for processing" });
  } catch (error) {
    console.error("Create task error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ... keep other controller functions as-is (getTasks, getTaskById, updateTaskStatus, getTaskStats)
// For brevity we won't duplicate the full file here; existing logic remains but imports fixed and OpenAI key normalized.

export const getTasks = async (req, res) => {
  try {
    const { agentId, status, priority, page = 1, limit = 10 } = req.query;
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
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    console.error("Get tasks error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getActivities = async (req, res) => {
  try {
    const { limit = 50, agentId, status } = req.query;
    const query = { userId: req.userId };
    if (agentId) query.agentId = agentId;
    if (status) query.status = status;

    const activities = await Activity.find(query)
      .populate('agentId', 'name role')
      .populate('taskId', 'title type status')
      .sort({ timestamp: -1 })
      .limit(Math.min(parseInt(limit, 10) || 50, 200));

    return res.status(200).json({ success: true, data: activities });
  } catch (error) {
    console.error('Get activities error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const task = await Task.findById(id)
      .populate("agentId", "name role instructions")
      .populate("userId", "username email");

    if (!task) {
      return res.status(404).json({ success: false, error: "Task not found" });
    }

    if (task.userId.toString() !== userId) {
      return res.status(403).json({ success: false, error: "You don't have permission to view this task" });
    }

    const activities = await Activity.find({ taskId: id }).sort({ timestamp: -1 });

    return res.status(200).json({ success: true, data: { ...task.toObject(), activities } });
  } catch (error) {
    console.error("Get task by ID error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, result, requiresHuman, message, title, type, input, priority, agentId } = req.body;
    const userId = req.userId;

    const validStatuses = ["received", "working", "resolved", "escalated", "failed"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });

    if (task.userId.toString() !== userId) return res.status(403).json({ success: false, error: "You don't have permission to update this task" });

    if (agentId) {
      const replacementAgent = await Agent.findOne({ _id: agentId, createdBy: userId, status: 'active' });
      if (!replacementAgent) return res.status(400).json({ success: false, error: 'Selected agent is not available' });
    }

    if (status) task.status = status;
    if (result) task.result = result;
    if (requiresHuman !== undefined) task.requiresHuman = requiresHuman;
    if (title) task.title = title;
    if (type) task.type = type;
    if (input !== undefined) task.input = input;
    if (priority) task.priority = priority;
    if (agentId) task.agentId = agentId;
    if (status === 'working' && !task.startedAt) task.startedAt = new Date();
    if ((status === 'resolved' || status === 'escalated' || status === 'failed') && !task.completedAt) {
      task.completedAt = new Date();
      task.processingTime = task.completedAt - task.startedAt;
    }
    task.updatedAt = new Date();

    await task.save();

    if (message) {
      const activityStatus = status === 'working' ? 'processing' :
        status === 'failed' ? 'failed' :
          ['resolved', 'escalated'].includes(status) ? 'success' : 'pending';
      await Activity.create({ agentId: task.agentId, taskId: id, userId, action: 'status_update', status: activityStatus, message });
    }

    return res.status(200).json({ success: true, data: task });
  } catch (error) {
    console.error('Update task status error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getTaskStats = async (req, res) => {
  try {
    const { agentId } = req.query;
    const userId = req.userId;

    let query = { userId };
    if (agentId) query.agentId = agentId;

    const stats = await Task.aggregate([
      { $match: query },
      { $group: { _id: '$status', count: { $sum: 1 }, avgProcessingTime: { $avg: '$processingTime' } } },
    ]);

    const priorityStats = await Task.aggregate([
      { $match: query },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    const formattedStats = { total: 0, byStatus: {}, byPriority: {}, avgProcessingTime: 0 };

    stats.forEach((stat) => {
      formattedStats.byStatus[stat._id] = { count: stat.count, avgTime: Math.round(stat.avgProcessingTime || 0) };
      formattedStats.total += stat.count;
    });

    priorityStats.forEach((stat) => { formattedStats.byPriority[stat._id] = stat.count; });

    return res.status(200).json({ success: true, data: formattedStats });
  } catch (error) {
    console.error('Get task stats error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Helper function to process task with AI (kept as originally implemented)
async function processTaskWithAI(taskId, agentId, userId, type, input, title, agent) {
  try {
    await Task.findByIdAndUpdate(taskId, { status: 'working', startedAt: new Date() });

    await Activity.create({ agentId, taskId, userId, action: 'started', status: 'processing', message: `Task "${title}" started processing` });

    const systemPrompt = agent.instructions || `You are a helpful AI agent with role: ${agent.role}. Capabilities: ${agent.capabilities ? agent.capabilities.join(', ') : ''}`;
    const userMessage = typeof input === 'string' ? input : JSON.stringify(input);

    if (!groq) {
      throw new Error('Groq client not configured (GROQ_API_KEY missing)');
    }

    const response = await groq.chat.completions.create({
      model: agent.model || process.env.GROQ_MODEL || "openai/gpt-oss-20b",
      messages: [ { role: 'system', content: systemPrompt }, { role: 'user', content: userMessage } ],
      temperature: agent.temperature,
      max_tokens: agent.maxTokens,
    });

    const aiResponse = response.choices[0].message.content;

    const requiresHuman = aiResponse.toLowerCase().includes('escalate') || aiResponse.toLowerCase().includes('human') || aiResponse.toLowerCase().includes('manual');

    const updatedTask = await Task.findByIdAndUpdate(taskId, { result: aiResponse, status: requiresHuman ? 'escalated' : 'resolved', requiresHuman, completedAt: new Date() }, { new: true });

    await Agent.findByIdAndUpdate(agentId, { $inc: { 'stats.tasksCompleted': 1 } });

    await Activity.create({ agentId, taskId, userId, action: requiresHuman ? 'escalated' : 'completed', status: 'success', message: aiResponse.substring(0, 500) });

    console.log(`✅ Task ${taskId} processed successfully. Status: ${requiresHuman ? 'escalated' : 'resolved'}`);
  } catch (error) {
    console.error('❌ Error processing task with AI:', error);
    await Task.findByIdAndUpdate(taskId, { status: 'failed', result: error.message, completedAt: new Date() });
    await Agent.findByIdAndUpdate(agentId, { $inc: { 'stats.tasksFailed': 1 } });
    await Activity.create({ agentId, taskId, userId, action: 'error', status: 'failed', message: `Error processing task: ${error.message}` });
  }
}
