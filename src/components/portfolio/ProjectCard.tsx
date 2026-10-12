import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { featuredFor, projectSlug, type Project } from "@/lib/portfolio-data";

export function projectImage(p: Project): string {
  return featuredFor(p.name)?.img ?? p.img;
}

/** A client project with a large image; details slide up on hover/focus and on touch devices are always visible. */
export default function ProjectCard({ p, index = 0, size = "md" }: { p: Project; index?: number; size?: "md" | "lg" }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: Math.min(index, 6) * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className={`pc group ${size === "lg" ? "pc-lg" : ""}`}
    >
      <Link to="/portfolio/$slug" params={{ slug: projectSlug(p.name) }} className="pc-link" aria-label={`${p.name} case study`}>
        <div className="pc-media">
          <img src={projectImage(p)} alt="" loading="lazy" decoding="async" className="pc-img" />
          <div className="pc-shade" />
          <span className="pc-cat">{p.category}</span>
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
