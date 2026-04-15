const WHATSAPP_URL = "https://wa.me/message/HHGMMWMRJFYUC1";

const SERVICES = [
  { icon: "🤖", name: "AI Automation", desc: "Automate follow-ups, bookings, and lead nurturing with intelligent AI systems that work 24/7." },
  { icon: "🌐", name: "Website Design & Dev", desc: "Stunning, conversion-optimized websites that build credibility and capture leads on autopilot." },
  { icon: "✉️", name: "Email Marketing", desc: "High-converting email sequences that nurture leads, recover abandoned carts, and drive repeat sales." },
  { icon: "📱", name: "Social Media Management", desc: "Consistent, engaging content that grows your audience and turns followers into paying customers." },
  { icon: "📈", name: "Ad Marketing", desc: "Targeted ad campaigns on Google, Facebook, and Instagram that deliver measurable ROI." },
  { icon: "🛒", name: "Ecommerce Growth", desc: "End-to-end ecommerce solutions from Shopify setup to conversion optimization and scaling." },
  { icon: "📲", name: "App Development", desc: "Custom mobile and web applications that streamline operations and delight your customers." },
];

export default function ServicesSection() {
  return (
    <section id="services" className="section-padding bg-background">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <span className="inline-block rounded-full bg-muted px-4 py-1.5 text-xs font-medium text-muted-foreground">
            What We Do
          </span>
          <h2 className="mt-4 font-display text-3xl font-extrabold text-foreground md:text-5xl">
            Everything Your Business Needs to{" "}
            <span className="gradient-text">Dominate Online</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
            From AI automation to full-stack web development — we deliver the digital infrastructure your business needs to grow.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {SERVICES.map((s, i) => (
            <a
              key={i}
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="gradient-border group flex flex-col rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-2xl transition-transform duration-500 group-hover:rotate-[360deg]">
                {s.icon}
              </span>
              <h3 className="mt-4 font-display text-lg font-bold text-foreground">{s.name}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-emma-blue transition-colors group-hover:text-emma-pink">
                Learn More <span aria-hidden>→</span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
