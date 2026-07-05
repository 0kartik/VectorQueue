export default function StatStrip({ stats }) {
  const getCount = (status) => stats.find(s => s.status === status)?.count || 0;

  const items = [
    { label: "PENDING", value: getCount("pending"), color: "text-muted" },
    { label: "ACTIVE", value: getCount("active"), color: "text-signal" },
    { label: "COMPLETED", value: getCount("completed"), color: "text-success" },
    { label: "DEAD LETTER", value: getCount("dead_letter"), color: "text-danger" },
  ];

  return (
    <div className="grid grid-cols-4 gap-px bg-panel-border rounded-lg overflow-hidden border border-panel-border">
      {items.map((item) => (
        <div key={item.label} className="bg-panel px-6 py-5">
          <div className="text-xs font-mono tracking-widest text-muted mb-2">{item.label}</div>
          <div className={`text-4xl font-display font-bold ${item.color}`}>{item.value}</div>
        </div>
      ))}
    </div>
  );
}