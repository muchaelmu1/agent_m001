// Backend/models/Agent.model.js
import mongoose from "mongoose";

const AgentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Agent name is required"],
      trim: true,
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
      default: "openai/gpt-oss-20b",
      enum: [
        "canopylabs/orpheus-arabic-saudi",
        "canopylabs/orpheus-v1-english",
        "groq/compound",
        "groq/compound-mini",
        "meta-llama/llama-prompt-guard-2-22m",
        "meta-llama/llama-prompt-guard-2-86m",
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
        "openai/gpt-oss-safeguard-20b",
        "qwen/qwen3.6-27b",
        "qwen/qwen3.8-27b",
        "whisper-large-v3",
        "whisper-large-v3-turbo",
      ],
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

AgentSchema.index({ createdBy: 1, name: 1 }, { unique: true });

const Agent = mongoose.model("Agent", AgentSchema);

export default Agent;