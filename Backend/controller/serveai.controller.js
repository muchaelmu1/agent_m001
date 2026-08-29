import Task from '../models/Task.js';
import Agent from '../models/Agent.model.js';
import Activity from '../models/Activity.model.js';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.openai_key,
});

// Get all agents
export const getAgents = async (req, res) => {
  try {
    const agents = await Agent.find({ status: 'active' });
    res.json({
      success: true,
      data: agents,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Create a new task and process it with AI
export const createTask = async (req, res) => {
  try {
    const { agentId, type, input, priority } = req.body;

    // Validate input
    if (!agentId || !type || !input) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: agentId, type, input',
      });
    }

    // Create task in database
    const task = await Task.create({
      agentId,
      type,
      input,
      status: 'received',
      priority: priority || 'normal',
    });

    // Process with AI asynchronously
    processTaskWithAI(task._id, agentId, type, input);

    res.status(201).json({
      success: true,
      data: task,
      message: 'Task created and queued for processing',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get all tasks (with optional filters)
export const getTasks = async (req, res) => {
  try {
    const { agentId, status, limit = 20, skip = 0 } = req.query;

    let query = {};
    if (agentId) query.agentId = agentId;
    if (status) query.status = status;

    const tasks = await Task.find(query)
      .populate('agentId', 'name role')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Task.countDocuments(query);

    res.json({
      success: true,
      data: tasks,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get single task by ID
export const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id).populate('agentId', 'name role instructions');

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    // Get related activities
    const activities = await Activity.find({ taskId: id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        ...task.toObject(),
        activities,
      },
    });
  } catch (error) {
    res.status(500).json({
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

    // Validate status
    const validStatuses = ['received', 'working', 'resolved', 'escalated', 'failed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const task = await Task.findByIdAndUpdate(
      id,
      {
        status,
        result,
        requiresHuman,
        updatedAt: new Date(),
      },
      { new: true }
    ).populate('agentId', 'name role');

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    // Log activity
    if (message) {
      await Activity.create({
        agentId: task.agentId,
        taskId: id,
        action: 'status_update',
        status: status,
        message: message,
      });
    }

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get task analytics/stats
export const getTaskStats = async (req, res) => {
  try {
    const { agentId } = req.query;

    let query = {};
    if (agentId) query.agentId = agentId;

    const stats = await Task.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const formattedStats = {
      total: 0,
      byStatus: {},
    };

    stats.forEach((stat) => {
      formattedStats.byStatus[stat._id] = stat.count;
      formattedStats.total += stat.count;
    });

    res.json({
      success: true,
      data: formattedStats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Helper function to process task with AI
async function processTaskWithAI(taskId, agentId, type, input) {
  try {
    // Update task status to "working"
    await Task.findByIdAndUpdate(taskId, { status: 'working' });

    // Get agent instructions
    const agent = await Agent.findById(agentId);

    if (!agent) {
      throw new Error('Agent not found');
    }

    // Create AI prompt
    const systemPrompt = agent.instructions || `You are a helpful AI agent with role: ${agent.role}`;
    const userMessage = typeof input === 'string' ? input : JSON.stringify(input);

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const aiResponse = response.choices[0].message.content;

    // Determine if human escalation is needed
    const requiresHuman = aiResponse.toLowerCase().includes('escalate') ||
                         aiResponse.toLowerCase().includes('human') ||
                         aiResponse.toLowerCase().includes('manual');

    // Update task with result
    await Task.findByIdAndUpdate(taskId, {
      result: aiResponse,
      status: requiresHuman ? 'escalated' : 'resolved',
      requiresHuman,
    });

    // Log activity
    await Activity.create({
      agentId,
      taskId,
      action: 'ai_processing',
      status: requiresHuman ? 'escalated' : 'resolved',
      message: aiResponse,
    });
  } catch (error) {
    // Update task status to "failed"
    await Task.findByIdAndUpdate(taskId, {
      status: 'failed',
      result: error.message,
    });

    // Log error activity
    await Activity.create({
      agentId,
      taskId,
      action: 'error',
      status: 'failed',
      message: `Error processing task: ${error.message}`,
    });

    console.error('❌ Error processing task with AI:', error);
  }
}