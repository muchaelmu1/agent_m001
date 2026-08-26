// routes/tasks.js
const express = require("express");
const Task = require("../models/Task");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const task = await Task.create({
      agentId: req.body.agentId,
      type: req.body.type,
      input: req.body.input
    });

    res.status(201).json(task);

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

module.exports = router;