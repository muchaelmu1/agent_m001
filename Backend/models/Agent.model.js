// Backend/models/Agent.model.js
import mongoose from "mongoose";

const AgentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Agent name is required"],
      trim: true,
      unique: true,
    },
    role: {
      type: String,
      required: [true, "Agent role is required"],
      enum: [
        "assistant",
        "specialist",
        "manager",
        "support",
        "analyzer",
        "custom",
      ],
      default: "assistant",
    },
    instructions: {
      type: String,
      default: "You are a helpful AI assistant",
    },
    description: {
      type: String,
      default: null,
    },
    capabilities: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["active", "inactive", "maintenance"],
      default: "active",
    },
    maxConcurrentTasks: {
      type: Number,
      default: 5,
      min: 1,
      max: 100,
    },
    model: {
      type: String,
      default: "gpt-3.5-turbo",
      enum: ["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo"],
    },
    temperature: {
      type: Number,
      default: 0.7,
      min: 0,
      max: 2,
    },
    maxTokens: {
      type: Number,
      default: 500,
      min: 100,
      max: 4000,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    stats: {
      tasksCompleted: {
        type: Number,
        default: 0,
      },
      tasksFailed: {
        type: Number,
        default: 0,
      },
      averageResponseTime: {
        type: Number,
        default: 0, // in milliseconds
      },
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

const Agent = mongoose.model("Agent", AgentSchema);

export default Agent;