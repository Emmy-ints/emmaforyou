import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="inline-block rounded-full bg-background px-4 py-1.5 text-xs font-medium text-muted-foreground">
            Who We Serve
          </span>
          <h2 className="mt-4 font-display text-3xl font-extrabold text-foreground md:text-5xl">
            Built for <span className="gradient-text">Every Business Type</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">
            If you own a business — we have a solution built specifically for you.
          </p>
        </motion.div>

        <motion.div
          className="mt-10 flex flex-wrap justify-center gap-2"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {TABS.map((tab) => (
            <motion.button
              key={tab}
              onClick={() => setActive(tab)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                active === tab
                  ? "btn-primary-gradient text-white"
                  : "bg-background text-muted-foreground hover:bg-accent"
              }`}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
            >
              {tab}
            </motion.button>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            className="mt-8 flex flex-wrap justify-center gap-3"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.96 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {NICHE_CATEGORIES[active]?.map((niche, i) => (
              <motion.span
                key={niche}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  niche.includes("✦")
                    ? "gradient-border bg-background text-foreground"
                    : "bg-background text-muted-foreground border border-border"
                }`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                whileHover={{ scale: 1.1, y: -4 }}
              >
                {niche}
              </motion.span>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
