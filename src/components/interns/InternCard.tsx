import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ExternalLink, Globe2, MapPin } from "lucide-react";
import { DESIGNATION, cardIntro, initials, linkLabel, photoAlt, platformName, type Designation, type InternCard as Card } from "@/lib/interns";

/** The designation badge. Every intern shows INTERN; only an admin promotion changes it. */
export function DesignationBadge({ d, className = "" }: { d: Designation; className?: string }) {
  const x = DESIGNATION[d] ?? DESIGNATION.intern;
  return <span className={`itn-badge ${x.cls} ${className}`} title={x.role}>{x.badge}</span>;
}

/**
 * Profile photo. Photos may be the intern's own hosted profile image (e.g. the link the owner
 * supplied), so they're hot-linked without a referrer; a broken link falls back to initials.
 */
export function InternPhoto({ i, size = "md", eager = false }: { i: Pick<Card, "display_name" | "photo_url" | "photo_alt" | "specialty" | "designation"> & { username?: string }; size?: "sm" | "md" | "lg"; eager?: boolean }) {
  const [broken, setBroken] = useState(false);
  const cls = `itn-photo itn-photo-${size}`;
  const px = size === "lg" ? 240 : size === "sm" ? 72 : 112;
  return i.photo_url && !broken
    ? <img src={i.photo_url} alt={photoAlt(i)} className={cls} loading={eager ? "eager" : "lazy"} decoding="async" referrerPolicy="no-referrer" width={px} height={px} onError={() => setBroken(true)} />
    : <span className={`${cls} itn-photo-ph`} role="img" aria-label={photoAlt(i)}>{initials(i.display_name || i.username || "")}</span>;
}

/** "@handle" exactly as supplied. */
export function Handle({ u, className = "" }: { u?: string; className?: string }) {
  return u ? <p className={`itn-handle ${className}`}>@{u}</p> : null;
}

/** Phone-style profile card: round photo, display name, @username, badge, headline, location and languages. */
export default function InternCard({ i, compact = false }: { i: Card & { languages?: string[] }; compact?: boolean }) {
  const name = i.display_name || (i.username ? `@${i.username}` : "");
  return (
    <article className="itn-card itn-phone" data-intern={i.slug}>
      <InternPhoto i={i} />
      <h3 className="mt-4 font-display text-lg font-semibold leading-tight">
        <Link to="/interns/$slug" params={{ slug: i.slug }} className="itn-link">{name}</Link>
      </h3>
      {i.display_name && <Handle u={i.username} />}
      <DesignationBadge d={i.designation} className="mt-2" />
      <p className="mt-3 text-sm font-medium text-[color:var(--emma-violet)]">{i.specialty}</p>
      {i.location && <p className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />{i.location}</p>}
      {!compact && <LanguageTags langs={i.languages ?? []} />}
      {!compact && cardIntro(i) && <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{cardIntro(i)}</p>}
      {!compact && i.skills.length > 0 && (
        <ul className="mt-4 flex flex-wrap justify-center gap-1.5" aria-label="Skills">{i.skills.slice(0, 6).map((s) => <li key={s} className="itn-chip">{s}</li>)}</ul>
      )}
      <Link to="/interns/$slug" params={{ slug: i.slug }} className="itn-view mt-5" aria-label={`View ${name}'s profile`} data-track="intern_card">
        View profile <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
      {(i.freelance_links?.length ?? 0) > 0 && (
        <a href={i.freelance_links![0].url} target="_blank" rel="noopener noreferrer nofollow" className="itn-fl-mini" data-track="intern_card_freelance" data-platform={i.freelance_links![0].platform} aria-label={`${linkLabel(i.freelance_links![0])} for ${name} (opens in a new tab)`}>
          {linkLabel(i.freelance_links![0])}<ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      )}
    </article>
  );
}

/** Language tags; on cards only the first few, with "+N" for the rest. */
export function LanguageTags({ langs, max = 4, className = "" }: { langs: string[]; max?: number; className?: string }) {
  if (!langs.length) return null;
  const more = langs.length - max;
  return (
    <ul className={`mt-3 flex flex-wrap justify-center gap-1.5 ${className}`} aria-label="Languages">
      {langs.slice(0, max).map((l) => <li key={l} className="itn-lang itn-lang-sm"><Globe2 className="h-3 w-3" aria-hidden="true" />{l}</li>)}
      {more > 0 && <li className="itn-lang itn-lang-sm" title={langs.slice(max).join(", ")}>+{more} more</li>}
    </ul>
  );
}

/** Non-link indicator for cards that are themselves a link (homepage). */
export function FreelanceHint({ i }: { i: Pick<Card, "freelance_links"> }) {
  const p = i.freelance_links?.[0]?.platform;
  return p ? <span className="itn-fl-hint"><ExternalLink className="h-3 w-3" aria-hidden="true" />On {platformName(p)}</span> : null;
}
