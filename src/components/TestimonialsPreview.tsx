import { motion } from "framer-motion";

export const TESTIMONIALS = [
  { name: "Chioma Okafor", biz: "Fashion Store", loc: "Lagos, Nigeria", text: "EmmaForYou transformed our Instagram from 200 to 3,000 followers in 6 weeks. Sales doubled.", rating: 5 },
  { name: "David Mensah", biz: "Auto Dealer", loc: "Accra, Ghana", text: "Our website now generates 15+ leads per week. Before EmmaForYou, we had zero online presence.", rating: 5 },
  { name: "Sarah Johnson", biz: "Real Estate Agent", loc: "Hanover, MD USA", text: "Closed 4 properties in 2 months from Facebook leads they set up. Incredible ROI.", rating: 5 },
  { name: "Adebayo Tunde", biz: "Restaurant", loc: "Port Harcourt, Nigeria", text: "Fully booked every weekend after Google Ads setup. EmmaForYou changed our business.", rating: 5 },
  { name: "Marie Dupont", biz: "Beauty Salon", loc: "Toulon, France", text: "The AI booking system saves us 3 hours daily. Clients love the instant confirmations.", rating: 5 },
  { name: "Klaus Weber", biz: "Fitness Gym", loc: "Halle, Germany", text: "Membership signups increased 180% after the new website and email campaigns launched.", rating: 5 },
  { name: "Ngozi Eze", biz: "Clinic", loc: "Abuja, Nigeria", text: "From 5 to 47 Google reviews and 3x new patients. EmmaForYou built our credibility online.", rating: 5 },
  { name: "James Molefe", biz: "Car Rental", loc: "Cookhouse, SA", text: "Our booking platform handles everything automatically now. Revenue up 200% in 90 days.", rating: 5 },
  { name: "Funke Adeyemi", biz: "Bakery", loc: "Ibadan, Nigeria", text: "Instagram orders went from 2 per week to 15+ daily. The content strategy was brilliant.", rating: 4.9 },
  { name: "Peter Okonkwo", biz: "Ecommerce", loc: "Lagos, Nigeria", text: "Scaled from ₦200k to ₦1.8M monthly revenue with Shopify optimization and ads.", rating: 5 },
  { name: "Lisa Ndlovu", biz: "Nail Studio", loc: "Johannesburg, SA", text: "Clients now book online 24/7. We're booked out 2 weeks in advance since the new system.", rating: 5 },
  { name: "Emmanuel Bassey", biz: "SaaS Startup", loc: "Lagos, Nigeria", text: "The app they built handles 500+ users daily with zero downtime. Professional team.", rating: 5 },
];

const ROW1 = TESTIMONIALS.slice(0, 6);
const ROW2 = TESTIMONIALS.slice(6, 12);

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} className="h-3.5 w-3.5" fill={s <= rating ? "#D4A017" : "#E5E7EB"} viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function TestimonialCard({ t }: { t: typeof TESTIMONIALS[0] }) {
  const initial = t.name[0];
  const hue = t.name.charCodeAt(0) * 15 % 360;

  return (
    <div className="gradient-border flex min-w-[280px] flex-col gap-3 rounded-2xl p-5 md:min-w-[320px]">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ background: `oklch(0.6 0.15 ${hue})` }}
        >
          {initial}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{t.name}</p>
          <p className="text-xs text-muted-foreground">{t.biz} · {t.loc}</p>
        </div>
      </div>
      <StarRating rating={t.rating} />
      <p className="text-sm leading-relaxed text-muted-foreground">"{t.text}"</p>
    </div>
  );
}

function MarqueeRow({ items, reverse }: { items: typeof TESTIMONIALS; reverse?: boolean }) {
  const doubled = [...items, ...items];
  return (
    <div className="overflow-hidden">
      <div className={`flex gap-5 ${reverse ? "animate-marquee-reverse" : "animate-marquee"}`} style={{ width: "max-content" }}>
        {doubled.map((t, i) => (
          <TestimonialCard key={i} t={t} />
        ))}
      </div>
    </div>
  );
}

export default function TestimonialsPreview() {
  return (
    <section className="section-padding overflow-hidden bg-muted/50">
      <motion.div
        className="mx-auto max-w-7xl text-center"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="inline-block rounded-full bg-background px-4 py-1.5 text-xs font-medium text-muted-foreground">
          Testimonials
        </span>
        <h2 className="mt-4 font-display text-3xl font-extrabold text-foreground md:text-5xl">
          <span className="gradient-text">Real Businesses.</span> Real Results.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">
          Don't take our word for it — hear from businesses we've helped transform.
        </p>
      </motion.div>

      <motion.div
        className="mt-12 flex flex-col gap-5"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <MarqueeRow items={ROW1} />
        <MarqueeRow items={ROW2} reverse />
      </motion.div>

      <motion.div
        className="mt-10 text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <a href="/testimonials" className="btn-primary-gradient inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm">
          See all testimonials and results →
        </a>
      </motion.div>
    </section>
  );
}
