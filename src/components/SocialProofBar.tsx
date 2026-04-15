const ITEMS = [
  "Fashion Stores", "Clinics", "Restaurants", "Real Estate", "Salons", "Coaches",
  "Ecommerce", "Gyms", "Barbershops", "Car Dealers", "SaaS", "Hotels",
  "Pharmacies", "Bakeries", "Lawyers", "Influencers", "Schools", "Logistics",
];

const LOCATIONS = "Serving 50+ business types · Nigeria · USA · France · Germany · South Africa";

export default function SocialProofBar() {
  const doubled = [...ITEMS, ...ITEMS];
  return (
    <section className="overflow-hidden border-y border-border bg-muted/30 py-4">
      <div className="animate-marquee flex gap-6" style={{ width: "max-content" }}>
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center gap-2 whitespace-nowrap text-sm font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emma-blue" />
            {item}
          </span>
        ))}
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground/60">{LOCATIONS}</p>
    </section>
  );
}
