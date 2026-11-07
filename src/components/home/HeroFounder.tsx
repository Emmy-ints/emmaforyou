import { Link } from "@tanstack/react-router";
import { FOUNDER } from "@/lib/seo";

/**
 * The person behind the product: Emmanuel's real portrait (a crop of /images/emmanuel.webp) docked to
 * the bottom-left corner of the hero's Growth OS demo, where the demo has only its empty icon rail —
 * so it signs the product without covering any of it. Links to the About page.
 */
export default function HeroFounder() {
  return (
    <Link to="/about" className="hx-founder" data-founder-presence="hero" data-track="hero_founder" aria-label={`Meet ${FOUNDER.name}, founder of EmmaForYou`}>
      <span className="hx-founder-ring" aria-hidden="true">
        <img src="/images/emmanuel-face-256.webp" width={256} height={256} alt="" decoding="async" />
      </span>
      <span className="hx-founder-cap" aria-hidden="true">
        <span className="hx-founder-name">{FOUNDER.name}</span>
        <span className="hx-founder-role">Founder · Meet Emmanuel →</span>
      </span>
    </Link>
  );
}
