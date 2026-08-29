// Backend/middleware/validation.middleware.js
export const validateCreateAgent = (req, res, next) => {
  const { name, role } = req.body;

  const errors = [];

  if (!name || name.trim().length === 0) {
    errors.push("Agent name is required");
  }

  if (!role) {
    errors.push("Agent role is required");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

export const validateCreateTask = (req, res, next) => {
  const { agentId, type, input, title } = req.body;

  const errors = [];

  if (!agentId) errors.push("Agent ID is required");
  if (!type) errors.push("Task type is required");
  if (!input) errors.push("Task input is required");
  if (!title) errors.push("Task title is required");

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};