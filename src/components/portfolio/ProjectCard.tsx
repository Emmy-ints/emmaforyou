import { useState } from "react";
import { Link } from "@tanstack/react-router";
import ProjectVisual from "./ProjectVisual";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { featuredFor, projectSlug, type Project } from "@/lib/portfolio-data";

export function projectImage(p: Project): string {
  return featuredFor(p.name)?.img ?? p.img;
}

/** True when the card shows a stock photo standing in for the client's own screenshots (see portfolio-data). */
export const isStandInImage = (p: Project) => !featuredFor(p.name);

/**
 * A client project with a large image; details slide up on hover/focus and on touch devices are always
 * visible. The card tilts gently towards the pointer, the photo drifts with scroll inside its frame,
 * and stock photos standing in for the client's own screenshots are labelled as such.
 */
export default function ProjectCard({ p, index = 0, size = "md", className = "" }: { p: Project; index?: number; size?: "md" | "lg"; className?: string }) {
  const standIn = isStandInImage(p);
  const [state, setState] = useState<"loading" | "ok" | "broken">("loading");
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: Math.min(index, 6) * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className={`pc group ${size === "lg" ? "pc-lg" : ""} ${className}`}
      data-tilt="3"
    >
      <Link to="/portfolio/$slug" params={{ slug: projectSlug(p.name) }} className="pc-link" aria-label={`${p.name} case study`}>
        <div className="pc-media" data-scroll>
          {state === "broken" ? <ProjectVisual p={p} className="pc-img" /> : (
            <img src={projectImage(p)} alt="" loading="lazy" decoding="async" className="pc-img" data-state={state}
              ref={(el) => { if (el?.complete && state === "loading") setState(el.naturalWidth > 0 ? "ok" : "broken"); }}
              onLoad={() => setState("ok")} onError={() => setState("broken")} />
          )}
          <div className="pc-shade" />
          <span className="pc-glare" aria-hidden="true" />
          <span className="pc-cat">{p.category}</span>
          {standIn && state !== "broken" && <span className="pc-standin" title="Stock photo shown until the client's own screenshots are added">Illustrative photo</span>}
          <span className="pc-outcome">{p.outcome}</span>
        </div>
        <div className="pc-body">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="pc-name">{p.name}</h3>
              <p className="pc-url">{p.url}</p>
            </div>
            <span className="pc-arrow"><ArrowUpRight className="h-4 w-4" /></span>
          </div>
          <div className="pc-reveal">
            <p className="pc-desc">{p.desc}</p>
            <ul className="pc-stack">
              {p.stack.map((s) => <li key={s}>{s}</li>)}
            </ul>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
