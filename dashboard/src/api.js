const API_BASE = "https://vectorqueue.onrender.com";

export async function fetchStats() {
  const res = await fetch(`${API_BASE}/stats`);
  return res.json();
}

export async function fetchJobs(status = null, limit = 50) {
  const url = status
    ? `${API_BASE}/jobs?status=${status}&limit=${limit}`
    : `${API_BASE}/jobs?limit=${limit}`;
  const res = await fetch(url);
  return res.json();
}

export async function fetchJobDetail(id) {
  const res = await fetch(`${API_BASE}/jobs/${id}`);
  return res.json();
}

export async function createJob(task, payload, priority) {
  const res = await fetch(`${API_BASE}/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task, payload, priority }),
  });
  return res.json();
}