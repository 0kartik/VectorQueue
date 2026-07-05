export default function FlowPipeline({ stats }) {
  const getCount = (status) => Number(stats.find(s => s.status === status)?.count || 0);

  const stages = [
    { key: "pending", label: "Pending", count: getCount("pending"), color: "#8B949E" },
    { key: "active", label: "Active", count: getCount("active"), color: "#E6621F", pulse: true },
    { key: "completed", label: "Completed", count: getCount("completed"), color: "#3FB950" },
    { key: "dead_letter", label: "Dead letter", count: getCount("dead_letter"), color: "#F85149" },
  ];

  return (
    <div className="bg-panel border border-panel-border rounded-lg p-8">
      <div className="text-xs font-mono tracking-widest text-muted mb-6">JOB FLOW</div>
      <div className="flex items-center">
        {stages.map((stage, i) => (
          <div key={stage.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className="w-4 h-4 rounded-full mb-3 relative"
                style={{ backgroundColor: stage.color }}
              >
                {stage.pulse && stage.count > 0 && (
                  <span
                    className="absolute inset-0 rounded-full animate-ping"
                    style={{ backgroundColor: stage.color, opacity: 0.6 }}
                  />
                )}
              </div>
              <div className="text-2xl font-mono font-medium" style={{ color: stage.color }}>
                {stage.count}
              </div>
              <div className="text-xs text-muted mt-1 font-body">{stage.label}</div>
            </div>
            {i < stages.length - 1 && (
              <div className="h-px flex-1 bg-panel-border mb-8" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}