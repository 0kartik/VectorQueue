require("dotenv").config();
const express = require("express");
const Redis = require("ioredis");
const pool = require("./db");

const app = express();
const cors = require("cors");
app.use(cors());
app.use(express.json());
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  tls: process.env.REDIS_URL?.startsWith("rediss://") ? {} : undefined,
});
// POST /jobs — create a new job
app.post("/jobs", async (req, res) => {
  try {
    const { task, payload = {}, priority = "low" } = req.body;

    if (!task) {
      return res.status(400).json({ error: "task is required" });
    }

    const jobData = { task, ...payload };

    const result = await pool.query(
      `INSERT INTO jobs (task_type, payload, priority, status)
       VALUES ($1, $2, $3, 'pending') RETURNING id`,
      [task, jobData, priority]
    );
    const jobId = result.rows[0].id;

    await pool.query(
      `INSERT INTO job_events (job_id, event_type, message) VALUES ($1, 'created', 'Job submitted via API')`,
      [jobId]
    );

    const job = JSON.stringify({ ...jobData, id: jobId, priority });
    const queueName = priority === "high" ? "jobs:high" : "jobs:low";
    await redis.lpush(queueName, job);

    res.status(201).json({ id: jobId, status: "pending", queue: queueName });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create job" });
  }
});

// GET /jobs — list jobs, optional ?status=completed filter
app.get("/jobs", async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    let query = "SELECT * FROM jobs";
    const values = [];

    if (status) {
      query += " WHERE status = $1";
      values.push(status);
    }
    query += ` ORDER BY created_at DESC LIMIT ${Number(limit)}`;

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

// GET /jobs/:id — single job + its event timeline
app.get("/jobs/:id", async (req, res) => {
  try {
    const jobResult = await pool.query("SELECT * FROM jobs WHERE id = $1", [req.params.id]);
    if (jobResult.rows.length === 0) {
      return res.status(404).json({ error: "Job not found" });
    }

    const eventsResult = await pool.query(
      "SELECT * FROM job_events WHERE job_id = $1 ORDER BY created_at ASC",
      [req.params.id]
    );

    res.json({ ...jobResult.rows[0], events: eventsResult.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch job" });
  }
});

// GET /stats — quick dashboard summary
app.get("/stats", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT status, COUNT(*) as count FROM jobs GROUP BY status`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`VectorQueue API running on port ${PORT}`));