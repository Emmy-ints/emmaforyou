import { Link } from "@tanstack/react-router";
import { PROJECTS, projectSlug } from "@/lib/portfolio-data";

/**
 * Client wall. Until real client logos are supplied, each client is set as a typographic wordmark
 * (their name, in our type) — never an imitation of their brand mark.
 */
export default function ClientWall({ tone = "light" }: { tone?: "light" | "ink" }) {
  return (
    <ul className={`cw ${tone === "ink" ? "cw-ink" : ""}`} aria-label="Clients we've worked with">
      {PROJECTS.map((p) => (
        <li key={p.name}>
          <Link to="/portfolio/$slug" params={{ slug: projectSlug(p.name) }} className="cw-item">
            <span className="cw-name">{p.name}</span>
            <span className="cw-meta">{p.category}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
