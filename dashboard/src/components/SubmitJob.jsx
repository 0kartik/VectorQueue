import { useState } from "react";
import { createJob } from "../api";

export default function SubmitJob({ onSubmitted }) {
  const [task, setTask] = useState("send_email");
  const [priority, setPriority] = useState("low");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await createJob(task, { triggeredFrom: "dashboard" }, priority);
    setSubmitting(false);
    onSubmitted?.();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-panel border border-panel-border rounded-lg p-6 flex items-end gap-4">
      <div className="flex-1">
        <label className="text-xs font-mono tracking-widest text-muted block mb-2">TASK TYPE</label>
        <select
          value={task}
          onChange={(e) => setTask(e.target.value)}
          className="w-full bg-bg border border-panel-border rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-signal"
        >
          <option value="send_email">send_email</option>
          <option value="resize_image">resize_image</option>
          <option value="critical_alert">critical_alert</option>
        </select>
      </div>
      <div className="w-40">
        <label className="text-xs font-mono tracking-widest text-muted block mb-2">PRIORITY</label>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="w-full bg-bg border border-panel-border rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-signal"
        >
          <option value="low">low</option>
          <option value="high">high</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="bg-signal text-white font-mono text-sm px-6 py-2 rounded hover:opacity-90 disabled:opacity-50 transition"
      >
        {submitting ? "Submitting..." : "Submit job"}
      </button>
    </form>
  );
}