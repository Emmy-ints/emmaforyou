import { useRef, useState } from "react";
import SectionHead from "./future/SectionHead";

const NICHE_CATEGORIES: Record<string, string[]> = {
  "Product Sellers": ["Fashion Stores ✦", "Shoes & Sneakers ✦", "Phone Accessories", "Gadgets & Electronics", "Furniture", "Perfume & Fragrance", "Food & Snacks ✦", "Skincare Products"],
  "Service Businesses": ["Coaches ✦", "Consultants", "Lawyers", "Accountants", "Fitness Trainers ✦", "Photographers", "Event Planners", "Tutors"],
  "Local Walk-In": ["Restaurants ✦", "Barbershops", "Salons ✦", "Spas", "Bakeries ✦", "Pharmacies", "Laundry Services", "Nail Studios"],
  "B2B / Corporate": ["SaaS Companies ✦", "Agencies", "Manufacturers", "Logistics ✦", "Wholesalers", "Printing Services"],
  "Creators": ["Influencers ✦", "Course Creators ✦", "YouTubers", "Podcasters", "Musicians", "Writers"],
  "Real Estate": ["Agents ✦", "Property Developers", "Short-Let Apartments ✦", "Property Managers"],
  "Auto Industry": ["Car Dealers ✦", "Car Rentals", "Mechanics", "Auto Parts", "Detailing Services"],
  "Health & Beauty": ["Clinics ✦", "Gyms ✦", "Dental Offices", "Opticians", "Wellness Centers"],
};

const TABS = Object.keys(NICHE_CATEGORIES);

/**
 * "Who we serve" as a sector console: a vertical selector (a scrolling rail on phones) and a field
 * of business types that assembles with depth — each chip floats on its own layer; the ones marked
 * ✦ in the owner's list glow as our most-served types. Proper ARIA tabs with arrow-key support.
 */
export default function NicheShowcase() {
  const [active, setActive] = useState(TABS[0]);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const n = TABS.length;
    const to = ["ArrowDown", "ArrowRight"].includes(e.key) ? (i + 1) % n : ["ArrowUp", "ArrowLeft"].includes(e.key) ? (i - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (to < 0) return;
    e.preventDefault(); setActive(TABS[to]); refs.current[to]?.focus();
  };
  const items = NICHE_CATEGORIES[active] ?? [];

  return (
    <section className="ns section-padding" aria-labelledby="ns-h">
      <div className="mx-auto max-w-7xl">
        <SectionHead id="ns-h" align="center" className="max-w-3xl" kicker="Who we serve" title="Built for Every Business Type" shine={["Every", "Business", "Type"]}
          sub="If you own a business — we have a solution built specifically for you." />

        <div className="ns-console lg mt-12">
          <div className="ns-tabs" role="tablist" aria-label="Business sectors" aria-orientation="vertical">
            {TABS.map((tab, i) => (
              <button key={tab} ref={(el) => { refs.current[i] = el; }} id={`ns-tab-${i}`} role="tab" aria-selected={active === tab} aria-controls="ns-panel"
                tabIndex={active === tab ? 0 : -1} onClick={() => setActive(tab)} onKeyDown={(e) => onKey(e, i)} className="ns-tab">
                <span className="ns-tab-n" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>{tab}
                <span className="ns-tab-count" aria-hidden="true">{NICHE_CATEGORIES[tab].length}</span>
              </button>
            ))}
          </div>
          <div id="ns-panel" role="tabpanel" aria-labelledby={`ns-tab-${TABS.indexOf(active)}`} className="ns-field">
            <div className="ns-rings" aria-hidden="true"><span /><span /><span /></div>
            <p className="ns-field-title">{active}</p>
            <ul key={active} className="ns-chips">
              {items.map((raw, i) => {
                const star = raw.includes("✦");
                const name = raw.replace("✦", "").trim();
                return (
                  <li key={raw} className={`ns-chip ${star ? "is-star" : ""}`} style={{ ["--i" as string]: i, ["--d" as string]: `${(i % 3) + 1}` }}>
                    {name}{star && <span className="ns-star" aria-label="most served">✦</span>}
                  </li>
                );
              })}
            </ul>
            <p className="ns-legend"><span aria-hidden="true">✦</span> Business types we serve most often</p>
          </div>
        </div>
      </div>
    </section>
  );
}
