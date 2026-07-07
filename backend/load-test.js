require("dotenv").config();
const Redis = require("ioredis");
const pool = require("./db");

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  tls: process.env.REDIS_URL?.startsWith("rediss://") ? {} : undefined,
});

const NUM_JOBS = 500;

async function loadTest() {
  console.log(`Pushing ${NUM_JOBS} jobs...`);
  const startPush = Date.now();

  for (let i = 0; i < NUM_JOBS; i++) {
    const result = await pool.query(
      `INSERT INTO jobs (task_type, payload, priority, status) VALUES ($1, $2, $3, 'pending') RETURNING id`,
      ["load_test", { batch: true, index: i }, "low"]
    );
    const jobId = result.rows[0].id;
    const job = JSON.stringify({ task: "load_test", id: jobId, priority: "low", index: i });
    await redis.lpush("jobs:low", job);
  }

  const pushDuration = (Date.now() - startPush) / 1000;
  console.log(`Pushed ${NUM_JOBS} jobs in ${pushDuration.toFixed(2)}s`);
  console.log(`Now start your workers and time how long they take to drain the queue.`);
  console.log(`Run: node check-queue-depth.js   (to monitor remaining jobs)`);

  redis.disconnect();
  pool.end();
}

loadTest();