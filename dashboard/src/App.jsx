import { useEffect, useState } from "react";
import { fetchStats, fetchJobs } from "./api";
import StatStrip from "./components/StatStrip";
import FlowPipeline from "./components/FlowPipeline";
import JobTable from "./components/JobTable";
import SubmitJob from "./components/SubmitJob";

function App() {
  const [stats, setStats] = useState([]);
  const [jobs, setJobs] = useState([]);

  const loadData = async () => {
    const [statsData, jobsData] = await Promise.all([fetchStats(), fetchJobs()]);
    setStats(statsData);
    setJobs(jobsData);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 2000); // live refresh every 2s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-bg px-8 py-10 max-w-5xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-display font-bold tracking-tight">VectorQueue</h1>
        <p className="text-sm text-muted mt-1">Distributed job queue — live monitor</p>
      </header>

      <div className="space-y-6">
        <SubmitJob onSubmitted={loadData} />
        <StatStrip stats={stats} />
        <FlowPipeline stats={stats} />
        <JobTable jobs={jobs} />
      </div>
    </div>
  );
}

export default App;