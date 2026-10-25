import SectionHead from "../future/SectionHead";

const PARTNERS = ["Meta Business Partner", "Google Partner", "Shopify Expert", "Stripe Verified", "Microsoft Partner", "WhatsApp Business"];
const CREDENTIALS = [
  { icon: "✓", text: "500+ Verified Client Reviews" },
  { icon: "🌍", text: "3 Continents Served" },
  { icon: "📅", text: "Operating Since 2019" },
  { icon: "🏆", text: "Featured Digital Agency" },
];

/** Credentials as brushed-metal plates under glass; a light sweep crosses them one after another. */
export default function TrustBadges() {
  return (
    <section className="tb section-padding" aria-labelledby="tb-h">
      <div className="mx-auto max-w-6xl">
        <SectionHead id="tb-h" align="center" title="Trusted Partners & Credentials" />
        <ul className="tb-grid grid mt-10">
          {PARTNERS.map((p, i) => <li key={p} className="tb-plate" style={{ ["--i" as string]: i }}><span>{p}</span></li>)}
        </ul>
        <ul className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {CREDENTIALS.map((c) => (
            <li key={c.text} className="tb-pill lg"><span className="text-[var(--emma-violet)]" aria-hidden="true">{c.icon}</span>{c.text}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
