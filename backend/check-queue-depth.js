require("dotenv").config();
const Redis = require("ioredis");
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  tls: process.env.REDIS_URL?.startsWith("rediss://") ? {} : undefined,
});

const startTime = Date.now();

async function check() {
  const pending = await redis.llen("jobs:low") + await redis.llen("jobs:high");
  const processing = await redis.llen("processing");
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`[${elapsed}s] pending: ${pending}, processing: ${processing}`);

  if (pending === 0 && processing === 0) {
    console.log(`\nQueue fully drained in ${elapsed}s`);
    redis.disconnect();
    process.exit(0);
  } else {
    setTimeout(check, 1000);
  }
}

check();