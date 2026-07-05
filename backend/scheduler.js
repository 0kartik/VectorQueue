const Redis = require("ioredis");
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

async function checkDelayedJobs() {
  const now = Date.now();
  const readyJobs = await redis.zrangebyscore("delayed_jobs", 0, now);

  for (const jobStr of readyJobs) {
    const job = JSON.parse(jobStr);
    const queueName = job.priority === "high" ? "jobs:high" : "jobs:low";

    console.log(`Moving delayed job back to ${queueName}:`, jobStr);
    await redis.lpush(queueName, jobStr);
    await redis.zrem("delayed_jobs", jobStr);
  }
}

setInterval(checkDelayedJobs, 1000);
console.log("Scheduler running...");