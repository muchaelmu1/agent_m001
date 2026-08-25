// models/Task.js
const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Agent"
  },

  type: String,

  input: mongoose.Schema.Types.Mixed,

  status: {
    type: String,
    enum: [
      "received",
      "working",
      "resolved",
      "escalated",
      "failed"
    ],
    default: "received"
  },

  result: mongoose.Schema.Types.Mixed,

  requiresHuman: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model("Task", taskSchema);