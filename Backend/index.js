// Backend/index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import { errorHandler } from "./middleware/errorHandler.middleware.js";

import Auth from "./Routes/Auth.js";
import agentRoutes from "./Routes/agent.route.js";
import serveaiRoutes from "./Routes/serveai.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (development)
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚀 ServeAI Backend is running",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/auth", Auth);
app.use("/api/agents", agentRoutes);
app.use("/api/serveai", serveaiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.path,
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`\n${"=".repeat(50)}`);
  console.log(`🚀 ServeAI Backend Server`);
  console.log(`🌐 Running on http://localhost:${PORT}`);
  console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? "✅ Configured" : "❌ Missing"}`);
  console.log(`🤖 OpenAI Key: ${process.env.openai_key ? "✅ Configured" : "❌ Missing"}`);
  console.log(`${"=".repeat(50)}\n`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});