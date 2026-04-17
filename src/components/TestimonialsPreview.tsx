import { motion } from "framer-motion";

function getFlag(loc: string): string {
  const l = loc.toLowerCase();
  if (/(nigeria|lagos|abuja|port harcourt|ibadan|kano|benin|enugu|kaduna)/.test(l)) return "🇳🇬";
  if (/(usa|united states|maryland|hanover|new york|atlanta|texas|miami|chicago|los angeles)/.test(l)) return "🇺🇸";
  if (/(france|toulon|paris|lyon|marseille)/.test(l)) return "🇫🇷";
  if (/(germany|halle|berlin|munich|hamburg)/.test(l)) return "🇩🇪";
  if (/(south africa|cookhouse|cape town|johannesburg|durban|pretoria)/.test(l)) return "🇿🇦";
  if (/(uk|london|manchester|birmingham|leeds|bristol|england)/.test(l)) return "🇬🇧";
  if (/(ghana|accra|kumasi)/.test(l)) return "🇬🇭";
  if (/(kenya|nairobi|mombasa)/.test(l)) return "🇰🇪";
  if (/(canada|toronto|vancouver|montreal|ottawa)/.test(l)) return "🇨🇦";
  if (/(spain|madrid|barcelona)/.test(l)) return "🇪🇸";
  if (/(colombia|bogota|medellin)/.test(l)) return "🇨🇴";
  return "🌍";
}

const TESTIMONIALS = [
  // Nigeria
  { name: "Chioma Okafor", biz: "Fashion Store", loc: "Lagos, Nigeria", text: "EmmaForYou transformed our Instagram from 200 to 3,000 followers in 6 weeks. Sales doubled.", rating: 5 },
  { name: "Adebayo Tunde", biz: "Restaurant", loc: "Port Harcourt, Nigeria", text: "Fully booked every weekend after Google Ads setup. EmmaForYou changed our business.", rating: 5 },
  { name: "Ngozi Eze", biz: "Clinic", loc: "Abuja, Nigeria", text: "From 5 to 47 Google reviews and 3x new patients. EmmaForYou built our credibility online.", rating: 5 },
  { name: "Funke Adeyemi", biz: "Bakery", loc: "Ibadan, Nigeria", text: "Instagram orders went from 2/week to 15+ daily. Content strategy was brilliant.", rating: 4.9 },
  { name: "Peter Okonkwo", biz: "Ecommerce", loc: "Kano, Nigeria", text: "Scaled from ₦200k to ₦1.8M monthly revenue with Shopify optimization and ads.", rating: 5 },
  { name: "Emmanuel Bassey", biz: "SaaS Startup", loc: "Benin City, Nigeria", text: "The app they built handles 500+ users daily with zero downtime. Professional team.", rating: 5 },
  { name: "Zainab Yusuf", biz: "Beauty Brand", loc: "Kaduna, Nigeria", text: "Email list grew from 0 to 8,000 subscribers in 4 months. ROI is unreal.", rating: 5 },
  { name: "Ifeanyi Nwosu", biz: "Logistics", loc: "Enugu, Nigeria", text: "WhatsApp automation handles 90% of customer enquiries now. Game changer.", rating: 5 },
  // USA
  { name: "Sarah Johnson", biz: "Real Estate", loc: "Hanover, Maryland USA", text: "Closed 4 properties in 2 months from Facebook leads they set up. Incredible ROI.", rating: 5 },
  { name: "Michael Brown", biz: "Auto Detailing", loc: "Atlanta, USA", text: "Bookings tripled in 60 days. The local SEO work alone paid for everything.", rating: 5 },
  { name: "Jessica Carter", biz: "Wellness Coach", loc: "Miami, USA", text: "Funnel converts at 8%. I went from 3 clients/month to fully booked.", rating: 5 },
  // UK
  { name: "Oliver Smith", biz: "Marketing Agency", loc: "London, UK", text: "Their AI automation saves my team 20 hours a week. Pure magic.", rating: 5 },
  { name: "Emily Watson", biz: "Boutique", loc: "Manchester, UK", text: "Online sales now 40% of revenue, up from zero. The Shopify build is flawless.", rating: 5 },
  { name: "Harry Thompson", biz: "Fitness Studio", loc: "Birmingham, UK", text: "Membership app + booking system = 220 new members in 90 days.", rating: 5 },
  { name: "Sophie Bennett", biz: "Florist", loc: "Bristol, UK", text: "Same-day delivery orders via Instagram are now my biggest income stream.", rating: 5 },
  { name: "James Carter", biz: "Consultancy", loc: "Leeds, UK", text: "LinkedIn lead-gen pipeline brings 12 qualified calls a week. Worth every penny.", rating: 5 },
  { name: "Charlotte Hughes", biz: "Skincare Brand", loc: "London, UK", text: "TikTok strategy went viral — 2 products sold out in 48 hours.", rating: 5 },
  // Ghana
  { name: "David Mensah", biz: "Auto Dealer", loc: "Accra, Ghana", text: "Our website now generates 15+ leads per week. Before EmmaForYou, zero online presence.", rating: 5 },
  { name: "Akosua Boateng", biz: "Catering", loc: "Kumasi, Ghana", text: "Wedding bookings up 300%. The portfolio site is stunning and converts.", rating: 5 },
  { name: "Kwame Asante", biz: "Tech Startup", loc: "Accra, Ghana", text: "Pitch deck site + product demo helped us close $80k in seed funding.", rating: 5 },
  { name: "Ama Owusu", biz: "Spa", loc: "Accra, Ghana", text: "Booking system runs itself. We focus on clients, not admin. Brilliant team.", rating: 5 },
  // Kenya
  { name: "John Kamau", biz: "Safari Tours", loc: "Nairobi, Kenya", text: "International bookings increased 5x. SEO + multilingual site changed everything.", rating: 5 },
  { name: "Grace Wanjiku", biz: "Coffee Brand", loc: "Nairobi, Kenya", text: "DTC ecommerce launch hit $30k in first month. Phenomenal execution.", rating: 5 },
  { name: "Daniel Mwangi", biz: "Real Estate", loc: "Mombasa, Kenya", text: "Virtual tour platform sold 8 units in one quarter. Outstanding work.", rating: 5 },
  { name: "Mercy Achieng", biz: "Fashion Designer", loc: "Nairobi, Kenya", text: "Reels strategy brought 50k followers and a global stockist deal.", rating: 5 },
  // Canada
  { name: "Liam O'Connor", biz: "Restaurant Group", loc: "Toronto, Canada", text: "Centralised booking + loyalty app across 4 locations. Repeat visits up 65%.", rating: 5 },
  { name: "Olivia Tremblay", biz: "Yoga Studio", loc: "Montreal, Canada", text: "Class bookings doubled. The website finally feels as premium as the brand.", rating: 5 },
  { name: "Noah Singh", biz: "Dental Clinic", loc: "Vancouver, Canada", text: "Google ranking jumped to top 3 in 4 months. Phones don't stop ringing.", rating: 5 },
  // Europe + SA (existing)
  { name: "Marie Dupont", biz: "Beauty Salon", loc: "Toulon, France", text: "The AI booking system saves us 3 hours daily. Clients love instant confirmations.", rating: 5 },
  { name: "Klaus Weber", biz: "Fitness Gym", loc: "Halle, Germany", text: "Membership signups increased 180% after the new website and email campaigns launched.", rating: 5 },
  { name: "Lisa Ndlovu", biz: "Nail Studio", loc: "Johannesburg, South Africa", text: "Clients now book 24/7. We're booked out 2 weeks in advance since the new system.", rating: 5 },
  { name: "James Molefe", biz: "Car Rental", loc: "Cookhouse, South Africa", text: "Our booking platform handles everything automatically. Revenue up 200% in 90 days.", rating: 5 },
];

const ROW1 = TESTIMONIALS.slice(0, Math.ceil(TESTIMONIALS.length / 2));
const ROW2 = TESTIMONIALS.slice(Math.ceil(TESTIMONIALS.length / 2));

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
  const flag = getFlag(t.loc);

  return (
    <div className="gradient-border flex min-w-[280px] flex-col gap-3 rounded-2xl p-5 md:min-w-[320px]">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ background: `oklch(0.6 0.15 ${hue})` }}
          >
            {initial}
          </div>
          <span className="absolute -bottom-1 -right-1 text-base leading-none drop-shadow-sm">{flag}</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{t.name}</p>
          <p className="text-xs text-muted-foreground">
            {t.biz} · <span aria-hidden>{flag}</span> {t.loc}
          </p>
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
          <span className="gradient-text">500+ Businesses.</span> Real Results.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">
          From 🇳🇬 Nigeria to 🇬🇧 UK, 🇺🇸 USA, 🇨🇦 Canada, 🇩🇪 Germany, 🇫🇷 France, 🇬🇭 Ghana, 🇰🇪 Kenya & 🇿🇦 South Africa — real businesses, real results.
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
        <a href="/testimonials" className="btn-green inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm">
          See All 500+ Testimonials →
        </a>
      </motion.div>
    </section>
  );
}
