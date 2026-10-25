import { Check, Minus } from "lucide-react";
import SectionHead from "../future/SectionHead";

const ROWS = [
  { feature: "Personalised strategy", us: "✓", agency: "Sometimes", freelancer: "✗" },
  { feature: "AI automation included", us: "✓", agency: "Extra cost", freelancer: "✗" },
  { feature: "Africa & global market expertise", us: "✓", agency: "✗", freelancer: "Maybe" },
  { feature: "Same-day WhatsApp support", us: "✓", agency: "✗", freelancer: "Maybe" },
  { feature: "Results in 30 days", us: "✓", agency: "✗", freelancer: "Maybe" },
  { feature: "Transparent pricing", us: "✓", agency: "✗", freelancer: "Variable" },
  { feature: "Dedicated account manager", us: "✓", agency: "$$$+", freelancer: "✗" },
  { feature: "Money-back guarantee", us: "✓", agency: "✗", freelancer: "✗" },
];

function Cell({ v, us }: { v: string; us?: boolean }) {
  if (v === "✓") return <span className={`ct-yes ${us ? "is-us" : ""}`}><Check className="h-4 w-4" aria-hidden="true" /><span className="sr-only">Yes</span></span>;
  if (v === "✗") return <span className="ct-no"><Minus className="h-4 w-4" aria-hidden="true" /><span className="sr-only">No</span></span>;
  return <span className="ct-text">{v}</span>;
}

/**
 * Comparison as a lit instrument: the EmmaForYou column is a glass beam that slides into place, rows
 * draw in one after another. On phones the table becomes one card per feature (no sideways scroll).
 */
export default function ComparisonTable() {
  return (
    <section className="ct section-padding" aria-labelledby="ct-h">
      <div className="mx-auto max-w-5xl">
        <SectionHead id="ct-h" align="center" className="max-w-3xl" kicker="How we compare" title="Why EmmaForYou vs. The Alternatives" shine={["EmmaForYou"]}
          sub="We're not the cheapest. We're not the biggest. We're the team that actually delivers." />

        <div className="ct-wrap lg mt-12 hidden md:block" data-scroll>
          <span className="ct-beam" aria-hidden="true" />
          <table className="ct-table">
            <caption className="sr-only">EmmaForYou compared with a big agency and a freelancer</caption>
            <thead>
              <tr>
                <th scope="col" className="text-left">Feature</th>
                <th scope="col" className="ct-us-h"><span className="font-display font-semibold">EmmaForYou</span><span className="ct-badge">Recommended</span></th>
                <th scope="col">Big Agency</th>
                <th scope="col">Freelancer</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => (
                <tr key={row.feature} style={{ ["--i" as string]: i }}>
                  <th scope="row" className="text-left font-medium">{row.feature}</th>
                  <td className="ct-us"><Cell v={row.us} us /></td>
                  <td><Cell v={row.agency} /></td>
                  <td><Cell v={row.freelancer} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="grid ct-cards mt-10 gap-3 md:hidden" aria-label="EmmaForYou compared with a big agency and a freelancer">
          {ROWS.map((row) => (
            <li key={row.feature} className="ct-card lg">
              <p className="font-display text-[0.98rem] font-semibold">{row.feature}</p>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="ct-card-us"><dt>EmmaForYou</dt><dd><Cell v={row.us} us /></dd></div>
                <div><dt>Big agency</dt><dd><Cell v={row.agency} /></dd></div>
                <div><dt>Freelancer</dt><dd><Cell v={row.freelancer} /></dd></div>
              </dl>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
