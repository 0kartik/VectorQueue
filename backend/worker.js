require("dotenv").config();
const Redis = require("ioredis");
const pool = require("./db");
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

const WORKER_ID = process.argv[2] || "worker-1";
const MAX_RETRIES = 3;
const CONCURRENCY_LIMITS = { resize_image: 2 };

let isShuttingDown = false;
process.on("SIGINT", () => {
  console.log(`[${WORKER_ID}] Shutdown signal received. Finishing current job, then exiting...`);
  isShuttingDown = true;
});

async function claimJob() {
  let jobStr = await redis.lmove("jobs:high", "processing", "RIGHT", "LEFT");
  if (jobStr) return jobStr;
  jobStr = await redis.lmove("jobs:low", "processing", "RIGHT", "LEFT");
  return jobStr;
}

async function canRun(taskType) {
  const limit = CONCURRENCY_LIMITS[taskType];
  if (!limit) return true;
  const current = await redis.get(`running_count:${taskType}`);
  return (Number(current) || 0) < limit;
}

async function processJob(jobStr) {
  const job = JSON.parse(jobStr);
  console.log(`[${WORKER_ID}] Processing job ${job.id}: ${job.task}`);
  if (Math.random() < 0.3) throw new Error("Simulated failure");
  await new Promise((resolve) => setTimeout(resolve, 2000));
  console.log(`[${WORKER_ID}] Finished job ${job.id}`);
}

async function updateJobStatus(jobId, status, extra = {}) {
  const fields = ["status = $2", "updated_at = now()"];
  const values = [jobId, status];
  let i = 3;

  if (extra.retries !== undefined) {
    fields.push(`retries = $${i++}`);
    values.push(extra.retries);
  }
  if (status === "completed" || status === "dead_letter") {
    fields.push("completed_at = now()");
  }

  await pool.query(`UPDATE jobs SET ${fields.join(", ")} WHERE id = $1`, values);
}

async function logEvent(jobId, eventType, workerId, message = null) {
  await pool.query(
    `INSERT INTO job_events (job_id, event_type, worker_id, message) VALUES ($1, $2, $3, $4)`,
    [jobId, eventType, workerId, message]
  );
}

async function handleFailure(jobStr) {
  const job = JSON.parse(jobStr);
  job.retries = (job.retries || 0) + 1;

  if (job.retries > MAX_RETRIES) {
    console.log(`[${WORKER_ID}] Job ${job.id} exceeded max retries. Moving to dead letter.`);
    await redis.lpush("dead_letter", JSON.stringify(job));
    await updateJobStatus(job.id, "dead_letter", { retries: job.retries });
    await logEvent(job.id, "dead_lettered", WORKER_ID, "Exceeded max retries");
    return;
  }

  const delaySeconds = Math.pow(2, job.retries);
  const runAt = Date.now() + delaySeconds * 1000;

  console.log(`[${WORKER_ID}] Job ${job.id} failed (attempt ${job.retries}). Retrying in ${delaySeconds}s.`);
  await redis.zadd("delayed_jobs", runAt, JSON.stringify(job));
  await updateJobStatus(job.id, "pending", { retries: job.retries });
  await logEvent(job.id, "retried", WORKER_ID, `Attempt ${job.retries} failed`);
}

async function pollQueue() {
  while (!isShuttingDown) {
    const jobStr = await claimJob();

    if (jobStr) {
      const job = JSON.parse(jobStr);

      if (!(await canRun(job.task))) {
        await redis.lrem("processing", 1, jobStr);
        await redis.lpush("jobs:low", jobStr);
        await new Promise((resolve) => setTimeout(resolve, 500));
        continue;
      }

      await redis.hset("processing_times", jobStr, Date.now());
      await redis.incr(`running_count:${job.task}`);
      await updateJobStatus(job.id, "active");
      await logEvent(job.id, "claimed", WORKER_ID);

      try {
        await processJob(jobStr);
        await updateJobStatus(job.id, "completed");
        await logEvent(job.id, "completed", WORKER_ID);
      } catch (err) {
        await handleFailure(jobStr);
      } finally {
        await redis.lrem("processing", 1, jobStr);
        await redis.hdel("processing_times", jobStr);
        await redis.decr(`running_count:${job.task}`);
      }
    } else {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.log(`[${WORKER_ID}] Shutdown complete. Exiting.`);
  redis.disconnect();
  process.exit(0);
}

console.log(`[${WORKER_ID}] Starting...`);
pollQueue();