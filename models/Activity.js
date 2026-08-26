// models/Activity.js

const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
  agentId: mongoose.Schema.Types.ObjectId,

  taskId: mongoose.Schema.Types.ObjectId,

  action: String,

  status: String,

  message: String
}, { timestamps: true });

module.exports = mongoose.model("Activity", activitySchema);