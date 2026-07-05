const statusColors = {
  pending: "text-muted",
  active: "text-signal",
  completed: "text-success",
  dead_letter: "text-danger",
};

export default function JobTable({ jobs }) {
  return (
    <div className="bg-panel border border-panel-border rounded-lg overflow-hidden">
      <div className="text-xs font-mono tracking-widest text-muted px-6 py-4 border-b border-panel-border">
        RECENT JOBS
      </div>
      <div className="divide-y divide-panel-border max-h-96 overflow-y-auto">
        {jobs.map((job) => (
          <div key={job.id} className="px-6 py-3 flex items-center gap-4 text-sm font-mono hover:bg-white/[0.02]">
            <span className={`w-24 shrink-0 uppercase text-xs ${statusColors[job.status] || "text-muted"}`}>
              {job.status}
            </span>
            <span className="text-muted shrink-0">{job.id.slice(0, 8)}</span>
            <span className="flex-1 truncate">{job.task_type}</span>
            <span className="text-muted shrink-0">
              {job.priority === "high" && <span className="text-signal">HIGH</span>}
              {job.priority === "low" && "low"}
            </span>
            <span className="text-muted shrink-0 text-xs">
              {new Date(job.created_at).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}