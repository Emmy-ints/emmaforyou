import { Gauge } from "lucide-react";
import GrowthAssessment from "./assessment/GrowthAssessment";
import SectionHead from "./future/SectionHead";
import { PILLARS } from "@/lib/growth-assessment";

const AXES = Object.values(PILLARS).map((p) => p.label);

/**
 * Homepage section: the full growth assessment, embedded, beside a scanning radar of the five areas
 * it scores (axes only, no sample values). The assessment card sits in liquid glass with a slow
 * light beam travelling round its edge.
 */
export default function AnalyserTeaser() {
  const pt = (i: number, r: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / AXES.length;
    return [100 + Math.cos(a) * r, 100 + Math.sin(a) * r] as const;
  };
  return (
    <section id="analyser-teaser" className="at section-padding" aria-labelledby="at-h">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start">
        <div className="lg:sticky lg:top-28">
          <SectionHead id="at-h" kicker={<><Gauge className="h-3.5 w-3.5" aria-hidden="true" /> Free growth assessment</>} title="Find out what's really holding your business back"
            sub="Eight questions, about two minutes. You get a score across five areas, an explanation of how it's calculated, and three things to fix first." />
          <figure className="at-radar mt-8" aria-label="The five areas the assessment scores">
            <svg viewBox="0 0 200 200" aria-hidden="true">
              {[30, 55, 80].map((r) => <polygon key={r} className="at-ring" points={AXES.map((_, i) => pt(i, r).join(",")).join(" ")} />)}
              {AXES.map((_, i) => { const [x, y] = pt(i, 80); return <line key={i} className="at-axis" x1="100" y1="100" x2={x} y2={y} />; })}
              <g className="at-sweep"><path d="M100 100 L100 18 A82 82 0 0 1 158 42 Z" /></g>
              {AXES.map((_, i) => { const [x, y] = pt(i, 80); return <circle key={i} className="at-node" cx={x} cy={y} r="3.2" style={{ ["--i" as string]: i }} />; })}
            </svg>
            <figcaption>
              <ul className="at-legend">{AXES.map((a, i) => <li key={a} style={{ ["--i" as string]: i }}><span aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>{a}</li>)}</ul>
            </figcaption>
          </figure>
        </div>
        <div className="at-card lg-strong rounded-[26px] p-5 md:p-8">
          <span className="at-beam" aria-hidden="true" />
          <GrowthAssessment embedded />
        </div>
      </div>
    </section>
  );
}
