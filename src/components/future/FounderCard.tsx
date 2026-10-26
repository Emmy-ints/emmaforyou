import { Link } from "@tanstack/react-router";
import { FOUNDER } from "@/lib/seo";

/**
 * Emmanuel's real photograph (public/images/emmanuel.webp) in a lit frame, used at the points of the
 * journey where a person matters: briefs, booking, contact and the service pages.
 */
export default function FounderCard({ line, cta = true, size = "md" }: { line: string; cta?: boolean; size?: "sm" | "md" }) {
  return (
    <figure className={`fc fc-${size}`}>
      <span className="fc-photo" aria-hidden="false">
        <img src="/images/emmanuel.webp" width={900} height={1350} alt={`${FOUNDER.name}, founder of EmmaForYou`} loading="lazy" decoding="async" />
      </span>
      <figcaption className="min-w-0">
        <p className="font-display text-[0.98rem] font-semibold text-foreground">{FOUNDER.name}</p>
        <p className="text-xs text-muted-foreground">Founder · developer, UI/UX designer, marketer and Web3 developer</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{line}</p>
        {cta && <Link to="/about" className="mt-2 inline-flex text-xs font-semibold text-[var(--emma-violet)] hover:underline">About Emmanuel →</Link>}
      </figcaption>
    </figure>
  );
}
