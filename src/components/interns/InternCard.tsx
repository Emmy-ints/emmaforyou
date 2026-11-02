import { Link } from "@tanstack/react-router";
import { ArrowRight, MapPin } from "lucide-react";
import { DESIGNATION, cardIntro, initials, photoAlt, type Designation, type InternCard as Card } from "@/lib/interns";

/** The designation badge. Every intern shows INTERN; only an admin promotion changes it. */
export function DesignationBadge({ d, className = "" }: { d: Designation; className?: string }) {
  const x = DESIGNATION[d] ?? DESIGNATION.intern;
  return <span className={`itn-badge ${x.cls} ${className}`} title={x.role}>{x.badge}</span>;
}

export function InternPhoto({ i, size = "md", eager = false }: { i: Pick<Card, "display_name" | "photo_url" | "photo_alt" | "specialty" | "designation">; size?: "md" | "lg"; eager?: boolean }) {
  const cls = size === "lg" ? "itn-photo itn-photo-lg" : "itn-photo";
  return i.photo_url
    ? <img src={i.photo_url} alt={photoAlt(i)} className={cls} loading={eager ? "eager" : "lazy"} decoding="async" width={size === "lg" ? 240 : 96} height={size === "lg" ? 240 : 96} />
    : <span className={`${cls} itn-photo-ph`} role="img" aria-label={photoAlt(i)}>{initials(i.display_name)}</span>;
}

export default function InternCard({ i, compact = false }: { i: Card; compact?: boolean }) {
  return (
    <article className="itn-card" data-intern={i.slug}>
      <div className="flex items-start gap-4">
        <InternPhoto i={i} />
        <div className="min-w-0 flex-1">
          <DesignationBadge d={i.designation} />
          <h3 className="mt-2 font-display text-lg font-semibold leading-tight">
            <Link to="/interns/$slug" params={{ slug: i.slug }} className="itn-link">{i.display_name}</Link>
          </h3>
          <p className="mt-1 text-sm font-medium text-[color:var(--emma-violet)]">{i.specialty}</p>
          {i.location && <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />{i.location}</p>}
        </div>
      </div>
      {!compact && cardIntro(i) && <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{cardIntro(i)}</p>}
      {!compact && i.skills.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Skills">{i.skills.slice(0, 6).map((s) => <li key={s} className="itn-chip">{s}</li>)}</ul>
      )}
      <Link to="/interns/$slug" params={{ slug: i.slug }} className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[color:var(--emma-violet)] hover:underline underline-offset-4" aria-label={`View ${i.display_name}'s profile`} data-track="intern_card">
        View profile <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </article>
  );
}
