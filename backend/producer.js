require("dotenv").config();
const Redis = require("ioredis");
const pool = require("./db");
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

async function addJob(jobData, priority = "low") {
  // 1. Insert into Postgres first — this is the source of truth
  const result = await pool.query(
    `INSERT INTO jobs (task_type, payload, priority, status)
     VALUES ($1, $2, $3, 'pending') RETURNING id`,
    [jobData.task, jobData, priority]
  );
  const jobId = result.rows[0].id;

  // 2. Log the creation event
  await pool.query(
    `INSERT INTO job_events (job_id, event_type, message) VALUES ($1, 'created', 'Job submitted')`,
    [jobId]
  );

  // 3. Push to Redis with the real DB id attached
  const job = JSON.stringify({ ...jobData, id: jobId, priority });
  const queueName = priority === "high" ? "jobs:high" : "jobs:low";
  await redis.lpush(queueName, job);

  console.log(`Job ${jobId} added to ${queueName}`);
}

async function main() {
  await addJob({ task: "send_email", to: "test@example.com" }, "low");
  await addJob({ task: "critical_alert" }, "high");
  redis.disconnect();
  pool.end();
}

main();