import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { WorkflowNode } from "@/lib/service-extras";

/** A step-by-step automation flow; the active step advances on its own and on click. */
export function WorkflowViz({ nodes }: { nodes: WorkflowNode[] }) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (reduce || paused) return;
    const t = setInterval(() => setActive((a) => (a + 1) % nodes.length), 1800);
    return () => clearInterval(t);
  }, [nodes.length, reduce, paused]);

  return (
    <div className="wf band-ink" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <ol className="wf-row">
        {nodes.map((n, i) => (
          <li key={n.label} className="wf-item">
            <button type="button" onClick={() => setActive(i)} aria-pressed={i === active} className={`wf-node ${i === active ? "is-active" : ""} ${i < active ? "is-done" : ""}`}>
              <span className="wf-num">{i + 1}</span>
              <span className="wf-label">{n.label}</span>
              <span className="wf-detail">{n.detail}</span>
            </button>
            {i < nodes.length - 1 && (
              <span className="wf-link" aria-hidden="true">
                <motion.span animate={{ scaleX: i < active ? 1 : 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} />
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Sample campaign dashboard, labelled as sample data. */
export function DashboardDemo({ title }: { title: string }) {
  const reduce = useReducedMotion();
  const weeks = [18, 24, 22, 31, 38, 35, 46, 52];
  const max = Math.max(...weeks);
  return (
    <div className="dd band-ink">
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-sm font-semibold text-white">{title} · campaign view</p>
        <span className="gos-badge"><span className="gos-live" />Sample data</span>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {[
          { k: "Enquiries", v: "266", d: "+38% vs first month" },
          { k: "Cost per enquiry", v: "$4.10", d: "down from $7.80" },
          { k: "Booked calls", v: "71", d: "27% of enquiries" },
          { k: "Reply time", v: "2 min", d: "average, 24/7" },
        ].map((s) => (
          <div key={s.k} className="roi-stat">
            <dt>{s.k}</dt>
            <dd>{s.v}</dd>
            <p className="mt-1 text-[11px] text-[#8f94bf]">{s.d}</p>
          </div>
        ))}
      </div>
      <p className="mt-6 text-xs text-[#a6abd0]">Enquiries per week</p>
      <div className="mt-2 flex h-36 items-end gap-2">
        {weeks.map((w, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1.5" title={`Week ${i + 1}: ${w} enquiries`}>
            <motion.div
              className="w-full rounded-t-[5px]"
              style={{ background: i === weeks.length - 1 ? "linear-gradient(180deg,#3dd6f5,#6d5bff)" : "rgba(139,123,255,0.55)" }}
              initial={reduce ? false : { height: 0 }}
              whileInView={{ height: `${(w / max) * 100}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            />
            <span className="text-[10px] text-[#8f94bf]">W{i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
