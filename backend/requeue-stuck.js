const Redis = require("ioredis");
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

const STUCK_TIMEOUT_MS = 30000;

async function requeueStuckJobs() {
  const times = await redis.hgetall("processing_times");
  const now = Date.now();

  for (const [jobStr, claimedAt] of Object.entries(times)) {
    if (now - Number(claimedAt) > STUCK_TIMEOUT_MS) {
      console.log("Requeuing stuck job:", jobStr);
      await redis.lrem("processing", 1, jobStr);
      await redis.hdel("processing_times", jobStr);
      await redis.lpush("jobs", jobStr);
    }
  }
}

requeueStuckJobs().then(() => redis.disconnect());