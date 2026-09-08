import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import serveaiRouter from './Routes/serveai.js';
import taskRouter from './Routes/Taskroute.js';
import authRouter from './Routes/Auth.js';
import agentRouter from './Routes/agent.route.js';
import connectDB from './config/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// __dirname replacement for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend static files from the repo's docs/ directory (one level up from Backend/)
app.use(express.static(path.join(__dirname, '..', 'docs')));

// Mount routers
app.use('/api/auth', authRouter);
app.use('/api/serveai', serveaiRouter);
app.use('/api/tasks', taskRouter);
app.use('/api/agents', agentRouter);

// Sample API root
app.get('/api', (req, res) => {
  res.json({ message: 'Backend API is running' });
});

// SPA fallback middleware — serve index.html for any unknown non-API route (for client-side routing)
// Use a middleware instead of app.get with a path pattern to avoid path-to-regexp issues.
app.use((req, res, next) => {
  // If the request is for API, skip this middleware
  if (req.path && req.path.startsWith('/api')) return next();

  // If the request is for an existing static asset, let express.static handle it
  // Otherwise, serve the SPA index.html
  res.sendFile(path.join(__dirname, '..', 'docs', 'index.html'), (err) => {
    if (err) next(err);
  });
});

// Connect DB then start server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
