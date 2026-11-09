import { Link } from "@tanstack/react-router";
import { Eye, Heart } from "lucide-react";
import { KIND_LABEL, industryName, type ShowcaseKind } from "@/lib/showcase";

export interface ShowcaseListItem {
  slug: string; kind: ShowcaseKind; title: string; summary: string | null; industry: string | null; place: string | null;
  business: string | null; lang: string; views: number; likes: number; created_at: string;
  preview: Record<string, unknown>;
}

export function timeAgo(iso: string, now = Date.now()) {
  const m = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d < 30 ? `${d} d ago` : new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

const hex = (v: unknown, d: string) => (typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v) ? v : d);
const list = (v: unknown) => (Array.isArray(v) ? v.map((x) => String(x)) : []);

/** A small, data-only illustration of the item (no generated HTML is loaded on list pages). */
export function ShowcaseArt({ item }: { item: Pick<ShowcaseListItem, "kind" | "title" | "preview"> }) {
  const p = item.preview ?? {};
  if (item.kind === "app") {
    const plan = (p.plan ?? {}) as Record<string, unknown>;
    const primary = hex(plan.primary, "#6d5bff"), accent = hex(plan.accent, "#3dd6f5");
    const tabs = list(plan.screens).slice(0, 4);
    return (
      <div className="sc-art sc-art-app" style={{ ["--p" as string]: primary, ["--a" as string]: accent }} aria-hidden="true">
        <div className="sc-phone">
          <div className="sc-phone-top" />
          <div className="sc-phone-hero"><b>{String(plan.name ?? item.title).slice(0, 22)}</b><i /><i /></div>
          <div className="sc-phone-cards"><i /><i /><i /></div>
          <div className="sc-phone-tabs">{tabs.map((t) => <span key={t}><em />{t.slice(0, 8)}</span>)}</div>
        </div>
      </div>
    );
  }
  if (item.kind === "website" || item.kind === "makeover") {
    const pages = item.kind === "website" ? list(p.pages).slice(0, 5) : ["Before", "After"];
    return (
      <div className={`sc-art sc-art-web${item.kind === "makeover" ? " sc-art-makeover" : ""}`} aria-hidden="true">
        <div className="sc-browser">
          <div className="sc-browser-bar"><i /><i /><i /></div>
          <div className="sc-browser-nav">{pages.map((x) => <span key={x}>{x}</span>)}</div>
          <div className="sc-browser-hero"><b /><b /><em /></div>
          <div className="sc-browser-grid"><i /><i /><i /></div>
        </div>
      </div>
    );
  }
  if (item.kind === "audit") {
    const score = Math.max(0, Math.min(100, Number(p.score) || 0));
    const pillars = (p.pillars ?? {}) as Record<string, number>;
    const tone = score >= 80 ? "#16a34a" : score >= 55 ? "#d97706" : "#dc2626";
    return (
      <div className="sc-art sc-art-audit" aria-hidden="true">
        <div className="sc-score" style={{ background: `conic-gradient(${tone} ${score * 3.6}deg, color-mix(in oklab, ${tone} 15%, transparent) 0)` }}><span>{score}</span></div>
        <ul>{["speed", "seo", "mobile", "conversion", "trust"].map((k) => <li key={k}><span>{k === "seo" ? "search" : k}</span><i style={{ width: `${Math.max(4, Math.min(100, Number(pillars[k]) || 0))}%` }} /></li>)}</ul>
      </div>
    );
  }
  if (item.kind === "emails") {
    const emails = (Array.isArray(p.emails) ? p.emails : []) as { subject?: string; day?: number }[];
    return (
      <div className="sc-art sc-art-emails" aria-hidden="true">
        {emails.slice(0, 3).map((e, i) => <div key={i} className="sc-mail"><span>Day {Number(e.day) || 0}</span><b>{String(e.subject ?? "").slice(0, 46)}</b></div>)}
      </div>
    );
  }
  const ms = (Array.isArray(p.milestones) ? p.milestones : []) as { month?: number; outcome?: string }[];
  return (
    <div className="sc-art sc-art-plan" aria-hidden="true">
      {ms.slice(0, 3).map((m, i) => <div key={i} className="sc-ms"><span>Month {i + 1}</span><b>{String(m.outcome ?? "").slice(0, 60)}</b></div>)}
    </div>
  );
}

export default function ShowcaseCard({ item, compact = false }: { item: ShowcaseListItem; compact?: boolean }) {
  const ind = industryName(item.industry);
  return (
    <Link to="/showcase/$slug" params={{ slug: item.slug }} className={`sc-card${compact ? " sc-card-compact" : ""}`} data-showcase-card={item.kind}>
      <ShowcaseArt item={item} />
      <div className="sc-card-body">
        <p className="sc-card-kind">{KIND_LABEL[item.kind].one}{ind ? ` · ${ind}` : ""}{item.place ? ` · ${item.place}` : ""}</p>
        <h3 className="sc-card-title">{item.title}</h3>
        {!compact && item.summary && <p className="sc-card-summary">{item.summary}</p>}
        <p className="sc-card-meta"><span>{timeAgo(item.created_at)}</span><span><Eye className="h-3.5 w-3.5" aria-hidden="true" /> {item.views}</span><span><Heart className="h-3.5 w-3.5" aria-hidden="true" /> {item.likes}</span></p>
      </div>
    </Link>
  );
}
