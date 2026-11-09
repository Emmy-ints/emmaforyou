import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import ShowcaseCard from "./ShowcaseCard";
import { useShowcase, useShowcaseStats } from "@/lib/showcase-data";
import { industryName } from "@/lib/showcase";

const fmt = (n: number) => n.toLocaleString();

/** Real usage counters from the database (how many times each free tool was actually used). */
export function ShowcaseCounters({ className = "", dark = false }: { className?: string; dark?: boolean }) {
  const s = useShowcaseStats();
  if (!s) return <div className={`sc-counters ${className}`} aria-hidden="true" style={{ minHeight: 64 }} />;
  const rows = [
    { n: s.prototypes, label: "prototypes built" },
    { n: s.audits, label: "websites audited" },
    { n: s.plans, label: "plans and proposals made" },
    { n: s.makeovers + s.emails, label: "makeovers and email sequences" },
  ].filter((r) => r.n > 0);
  if (!rows.length) return null;
  const since = s.since ? new Date(s.since).toLocaleDateString(undefined, { month: "long", year: "numeric" }) : null;
  return (
    <div className={`sc-counters${dark ? " sc-counters-dark" : ""} ${className}`} data-showcase-counters>
      <ul>{rows.map((r) => <li key={r.label}><b>{fmt(r.n)}</b><span>{r.label}</span></li>)}</ul>
      {since && <p>Counted live from our tools since {since}.</p>}
    </div>
  );
}

/**
 * "Recently built on EmmaForYou": the newest showcase items. Used on the homepage and (filtered) on industry pages.
 * Hides itself when there aren't enough items to look alive.
 */
export default function ShowcaseStrip({ industry, title, min = 3, limit = 8, inset = false }: { industry?: string; title?: string; min?: number; limit?: number; inset?: boolean }) {
  const items = useShowcase({ industry: industry ?? null, limit });
  if (!items || items.length < min) return null;
  const ind = industryName(industry);
  return (
    <section className={`sc-strip${inset ? " sc-strip-inset" : ""}`} aria-labelledby={`sc-strip-${industry ?? "all"}`} data-showcase-strip={industry ?? "all"}>
      <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-3 px-5">
        <div>
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"><Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Made on EmmaForYou</p>
          <h2 id={`sc-strip-${industry ?? "all"}`} className="mt-1 font-display text-2xl font-bold md:text-3xl">{title ?? (ind ? `What ${ind.toLowerCase()} built here` : "Recently built by visitors")}</h2>
        </div>
        <Link to="/showcase" className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--emma-violet)]">See everything <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
      </div>
      <ul className="sc-strip-row" aria-label="Recent showcase items">
        {items.map((it) => <li key={it.slug}><ShowcaseCard item={it} compact /></li>)}
      </ul>
    </section>
  );
}
