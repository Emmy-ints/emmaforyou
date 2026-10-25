import type { ReactNode } from "react";
import { KineticText } from "./Kinetic";

/**
 * Standard section heading for the future design language: signal-dot eyebrow, a kinetic display
 * heading (words rise in when the heading reaches the screen) and an optional lead paragraph.
 * `tone="ink"` is for midnight bands. The heading text stays one real <h2>.
 */
export default function SectionHead({
  kicker, title, shine, sub, align = "left", tone = "light", as: H = "h2", id, className = "", children,
}: {
  kicker?: ReactNode; title: string; shine?: string[]; sub?: ReactNode; align?: "left" | "center"; tone?: "light" | "ink";
  as?: "h1" | "h2" | "h3"; id?: string; className?: string; children?: ReactNode;
}) {
  const center = align === "center";
  return (
    <div className={`sx-head ${center ? "mx-auto text-center" : ""} ${tone === "ink" ? "sx-head-ink" : ""} ${className}`}>
      {kicker && <p className={`sx-kicker ${center ? "justify-center" : ""}`}><span className="sx-kicker-dot" aria-hidden="true" />{kicker}</p>}
      <H id={id} className="sx-title"><KineticText text={title} shine={shine} base={40} /></H>
      {sub && <p className={`sx-sub ${center ? "mx-auto" : ""}`}>{sub}</p>}
      {children}
    </div>
  );
}
