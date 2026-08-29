// Backend/controller/agent.controller.js
import Agent from "../models/Agent.model.js";

// Get all agents
export const getAgents = async (req, res) => {
  try {
    const { status, role, page = 1, limit = 10 } = req.query;

    let query = { createdBy: req.userId };

    if (status) query.status = status;
    if (role) query.role = role;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const agents = await Agent.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Agent.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: agents,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get agents error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get agent by ID
export const getAgentById = async (req, res) => {
  try {
    const { id } = req.params;

    const agent = await Agent.findById(id).populate("createdBy", "username email");

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: "Agent not found",
      });
    }

    // Check if user owns this agent
    if (agent.createdBy._id.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        error: "You don't have permission to view this agent",
      });
    }

    return res.status(200).json({
      success: true,
      data: agent,
    });
  } catch (error) {
    console.error("Get agent by ID error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Create new agent
export const createAgent = async (req, res) => {
  try {
    const {
      name,
      role,
      instructions,
      description,
      capabilities,
      model,
      temperature,
      maxTokens,
    } = req.body;

    // Validate required fields
    if (!name || !role) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: name, role",
      });
    }

    // Check if agent name already exists
    const existingAgent = await Agent.findOne({ name });
    if (existingAgent) {
      return res.status(409).json({
        success: false,
        error: "Agent with this name already exists",
      });
    }

    const agent = await Agent.create({
      name,
      role,
      instructions: instructions || "You are a helpful AI assistant",
      description: description || null,
      capabilities: capabilities || [],
      model: model || "gpt-3.5-turbo",
      temperature: temperature || 0.7,
      maxTokens: maxTokens || 500,
      createdBy: req.userId,
    });

    return res.status(201).json({
      success: true,
      data: agent,
      message: "Agent created successfully",
    });
  } catch (error) {
    console.error("Create agent error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Update agent
export const updateAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      role,
      instructions,
      status,
      description,
      capabilities,
      model,
      temperature,
      maxTokens,
    } = req.body;

    const agent = await Agent.findById(id);

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: "Agent not found",
      });
    }

    // Check ownership
    if (agent.createdBy.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        error: "You don't have permission to update this agent",
      });
    }

    // Update fields
    if (name) agent.name = name;
    if (role) agent.role = role;
    if (instructions) agent.instructions = instructions;
    if (status) agent.status = status;
    if (description) agent.description = description;
    if (capabilities) agent.capabilities = capabilities;
    if (model) agent.model = model;
    if (temperature !== undefined) agent.temperature = temperature;
    if (maxTokens) agent.maxTokens = maxTokens;

    await agent.save();

    return res.status(200).json({
      success: true,
      data: agent,
      message: "Agent updated successfully",
    });
  } catch (error) {
    console.error("Update agent error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Delete agent
export const deleteAgent = async (req, res) => {
  try {
    const { id } = req.params;

    const agent = await Agent.findById(id);

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: "Agent not found",
      });
    }

    // Check ownership
    if (agent.createdBy.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        error: "You don't have permission to delete this agent",
      });
    }

    await Agent.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Agent deleted successfully",
    });
  } catch (error) {
    console.error("Delete agent error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Deactivate agent
export const deactivateAgent = async (req, res) => {
  try {
    const { id } = req.params;

    const agent = await Agent.findById(id);

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: "Agent not found",
      });
    }

    // Check ownership
    if (agent.createdBy.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        error: "You don't have permission to deactivate this agent",
      });
    }

    agent.status = "inactive";
    await agent.save();

    return res.status(200).json({
      success: true,
      data: agent,
      message: "Agent deactivated successfully",
    });
  } catch (error) {
    console.error("Deactivate agent error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get agent stats
export const getAgentStats = async (req, res) => {
  try {
    const { id } = req.params;

    const agent = await Agent.findById(id);

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: "Agent not found",
      });
    }

    // Check ownership
    if (agent.createdBy.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        error: "You don't have permission to view this agent's stats",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        agentId: agent._id,
        name: agent.name,
        stats: agent.stats,
      },
    });
  } catch (error) {
    console.error("Get agent stats error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};