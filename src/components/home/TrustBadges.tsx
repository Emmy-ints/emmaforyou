import SectionHead from "../future/SectionHead";
import { ClaimGate, ClaimTag } from "../future/ClaimTag";

const PARTNERS = ["Meta Business Partner", "Google Partner", "Shopify Expert", "Stripe Verified", "Microsoft Partner", "WhatsApp Business"];
const CREDENTIALS = [
  { icon: "✓", text: "500+ Verified Client Reviews", claim: "cred-reviews" },
  { icon: "🌍", text: "3 Continents Served", claim: "stat-continents" },
  { icon: "📅", text: "Operating Since 2019", claim: "cred-since" },
  { icon: "🏆", text: "Featured Digital Agency", claim: "cred-featured" },
];

/** Credentials as brushed-metal plates under glass; a light sweep crosses them one after another. */
export default function TrustBadges() {
  return (
    <section className="tb section-padding" aria-labelledby="tb-h">
      <div className="mx-auto max-w-6xl">
        <SectionHead id="tb-h" align="center" title="Trusted Partners & Credentials" />
        <ClaimGate id="partners">
          <ul className="tb-grid grid mt-10">
            {PARTNERS.map((p, i) => <li key={p} className="tb-plate" style={{ ["--i" as string]: i }}><span>{p}</span></li>)}
          </ul>
          <p className="mt-3 text-center"><ClaimTag id="partners" /></p>
        </ClaimGate>
        <ul className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {CREDENTIALS.map((c) => (
            <ClaimGate key={c.text} id={c.claim}><li className="tb-pill lg"><span className="text-[var(--emma-violet)]" aria-hidden="true">{c.icon}</span>{c.text}<ClaimTag id={c.claim} /></li></ClaimGate>
          ))}
        </ul>
      </div>
    </section>
  );
}
