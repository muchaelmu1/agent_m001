// Backend/models/Task.js
import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
    },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      required: [true, "Agent ID is required"],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    type: {
      type: String,
      enum: ["generation", "analysis", "classification", "extraction", "custom"],
      required: [true, "Task type is required"],
    },
    input: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, "Task input is required"],
    },
    status: {
      type: String,
      enum: ["received", "working", "resolved", "escalated", "failed"],
      default: "received",
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },
    result: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    error: {
      type: String,
      default: null,
    },
    requiresHuman: {
      type: Boolean,
      default: false,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    processingTime: {
      type: Number,
      default: null, // in milliseconds
    },
    retryCount: {
      type: Number,
      default: 0,
      max: 3,
    },
    tags: {
      type: [String],
      default: [],
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for faster queries
TaskSchema.index({ agentId: 1, status: 1 });
TaskSchema.index({ userId: 1, createdAt: -1 });
TaskSchema.index({ status: 1 });

export default mongoose.models.Task || mongoose.model("Task", TaskSchema);