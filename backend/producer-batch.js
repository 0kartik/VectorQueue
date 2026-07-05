// producer-batch.js
const Redis = require("ioredis");
const redis = new Redis();

async function main() {
  for (let i = 1; i <= 10; i++) {
    await redis.lpush("jobs", JSON.stringify({ id: i, task: "batch_job" }));
  }
  console.log("10 jobs added");
  redis.disconnect();
}
main();