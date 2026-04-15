import { useState } from "react";

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

export default function NicheShowcase() {
  const [active, setActive] = useState(TABS[0]);

  return (
    <section className="section-padding bg-muted/30">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <span className="inline-block rounded-full bg-background px-4 py-1.5 text-xs font-medium text-muted-foreground">
            Who We Serve
          </span>
          <h2 className="mt-4 font-display text-3xl font-extrabold text-foreground md:text-5xl">
            Built for <span className="gradient-text">Every Business Type</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">
            If you own a business — we have a solution built specifically for you.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActive(tab)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                active === tab
                  ? "btn-primary-gradient text-white"
                  : "bg-background text-muted-foreground hover:bg-accent"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {NICHE_CATEGORIES[active]?.map((niche) => (
            <span
              key={niche}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                niche.includes("✦")
                  ? "gradient-border bg-background text-foreground"
                  : "bg-background text-muted-foreground border border-border"
              }`}
            >
              {niche}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
