const { fork } = require("child_process");

console.log("Starting all VectorQueue services...");

// Start the API server
require("./server.js");

// Fork worker and scheduler as separate processes
const worker1 = fork("./worker.js", ["worker-1"]);
const scheduler = fork("./scheduler.js");

worker1.on("exit", (code) => console.log(`worker-1 exited with code ${code}`));
scheduler.on("exit", (code) => console.log(`scheduler exited with code ${code}`));

process.on("SIGTERM", () => {
  console.log("Shutting down all services...");
  worker1.kill("SIGTERM");
  scheduler.kill("SIGTERM");
  process.exit(0);
});