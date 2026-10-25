const ITEMS = [
  "Fashion Stores", "Clinics", "Restaurants", "Real Estate", "Salons", "Coaches",
  "Ecommerce", "Gyms", "Barbershops", "Car Dealers", "SaaS", "Hotels",
  "Pharmacies", "Bakeries", "Lawyers", "Influencers", "Schools", "Logistics",
];

const LOCATIONS = "Serving 50+ business types · Nigeria · USA · France · Germany · South Africa";

/**
 * Two counter-moving rails of business types under a glass lens, faded at the edges. The rails pause
 * on hover; with reduced motion they become a static wrapped list. The duplicate copy that makes the
 * loop seamless is hidden from screen readers.
 */
export default function SocialProofBar() {
  const half = Math.ceil(ITEMS.length / 2);
  const rows = [ITEMS.slice(0, half), ITEMS.slice(half)];
  return (
    <section className="spb" aria-label="Business types we serve">
      <ul className="sr-only">{ITEMS.map((i) => <li key={i}>{i}</li>)}</ul>
      <div className="spb-rails" aria-hidden="true">
        {rows.map((row, r) => (
          <div key={r} className={`spb-rail ${r ? "spb-rev" : ""}`}>
            <div className="spb-track">
              {[...row, ...row, ...row].map((item, i) => (
                <span key={i} className="spb-chip"><span className="spb-dot" />{item}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="spb-loc">{LOCATIONS}</p>
    </section>
  );
}
