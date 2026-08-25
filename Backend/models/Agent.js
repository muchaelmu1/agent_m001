// models/Agent.js
const mongoose = require("mongoose");

const agentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  role: {
    type: String,
    required: true
  },

  instructions: String,

  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active"
  }
}, { timestamps: true });

module.exports = mongoose.model("Agent", agentSchema);