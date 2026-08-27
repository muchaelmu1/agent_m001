import Agent from '../models/Agent.js';

// Get all agents
export const getAgents = async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = {};
    if (status) query.status = status;

    const agents = await Agent.find(query).sort({ createdAt: -1 });

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

// Get agent by ID
export const getAgentById = async (req, res) => {
  try {
    const { id } = req.params;

    const agent = await Agent.findById(id);

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found',
      });
    }

    res.json({
      success: true,
      data: agent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Create new agent
export const createAgent = async (req, res) => {
  try {
    const { name, role, instructions, status } = req.body;

    // Validate required fields
    if (!name || !role) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, role',
      });
    }

    const agent = await Agent.create({
      name,
      role,
      instructions: instructions || '',
      status: status || 'active',
    });

    res.status(201).json({
      success: true,
      data: agent,
      message: 'Agent created successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Update agent
export const updateAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, instructions, status } = req.body;

    // Validate status if provided
    if (status && !['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be "active" or "inactive"',
      });
    }

    const agent = await Agent.findByIdAndUpdate(
      id,
      { name, role, instructions, status },
      { new: true, runValidators: true }
    );

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found',
      });
    }

    res.json({
      success: true,
      data: agent,
      message: 'Agent updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Delete agent
export const deleteAgent = async (req, res) => {
  try {
    const { id } = req.params;

    const agent = await Agent.findByIdAndDelete(id);

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found',
      });
    }

    res.json({
      success: true,
      message: 'Agent deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Deactivate agent
export const deactivateAgent = async (req, res) => {
  try {
    const { id } = req.params;

    const agent = await Agent.findByIdAndUpdate(
      id,
      { status: 'inactive' },
      { new: true }
    );

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found',
      });
    }

    res.json({
      success: true,
      data: agent,
      message: 'Agent deactivated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};