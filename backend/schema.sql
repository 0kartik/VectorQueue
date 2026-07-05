-- VectorQueue database schema
-- Run this against your PostgreSQL instance (e.g. via Supabase SQL editor)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Core jobs table: current state of every job ever submitted
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',       -- pending | active | completed | dead_letter
  priority TEXT NOT NULL DEFAULT 'low',         -- high | low
  retries INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  completed_at TIMESTAMP
);

-- Full event history per job: the audit trail
CREATE TABLE IF NOT EXISTS job_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,   -- created | claimed | completed | retried | dead_lettered
  worker_id TEXT,
  message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Indexes for common dashboard/API query patterns
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_job_events_job_id ON job_events(job_id);