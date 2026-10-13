import { Link } from "@tanstack/react-router";

const WHATSAPP_URL = "https://wa.me/message/HHGMMWMRJFYUC1";

const SERVICE_LINKS = [
  { label: "AI Automation", slug: "ai-automation" },
  { label: "Website Design & Development", slug: "website-design" },
  { label: "Ecommerce & Shopify", slug: "ecommerce" },
  { label: "Email Marketing", slug: "email-marketing" },
  { label: "Social Media Management", slug: "social-media" },
  { label: "Paid Advertising", slug: "ad-marketing" },
  { label: "App Development", slug: "app-development" },
];

const EXPERTISE_LINKS = [
  { label: "UI/UX Design", slug: "ui-ux-design" },
  { label: "Conversion Optimisation", slug: "conversion-rate-optimisation" },
  { label: "Marketing & Promotion", slug: "marketing-promotion" },
  { label: "Business Consulting", slug: "business-consulting" },
  { label: "Accountability Coaching", slug: "accountability-coaching" },
  { label: "Web3 & dApps", slug: "web3-development" },
  { label: "Smart Contracts (Solidity)", slug: "smart-contract-development" },
  { label: "Blockchain & Crypto", slug: "blockchain-crypto" },
];

const LINKS = [
  { label: "All Services", to: "/services" },
  { label: "Contact", to: "/contact" },
  { label: "Why EmmaForYou", to: "/why-emmaforyou" },
  { label: "Industries", to: "/industries" },
  { label: "All Free Tools", to: "/tools" },
  { label: "Client Portal", to: "/portal" },
  { label: "Dashboard", to: "/dashboard" },
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Portfolio", to: "/portfolio" },
  { label: "Case Studies", to: "/cases" },
  { label: "Testimonials", to: "/testimonials" },
  { label: "Pricing", to: "/pricing" },
  { label: "FAQ", to: "/faq" },
];

const TOOL_LINKS = [
  { label: "Website Audit", to: "/website-audit" },
  { label: "AI Receptionist Demo", to: "/ai-receptionist" },
  { label: "AI Website Makeover", to: "/makeover" },
  { label: "Instant Proposal", to: "/proposal" },
  { label: "Book a Strategy Call", to: "/book" },
  { label: "Smart Contract Check", to: "/smart-contract-check" },
  { label: "90-Day Goal Planner", to: "/goal-planner" },
  { label: "Growth Assessment", to: "/analyser" },
  { label: "ROI Calculator", to: "/roi-calculator" },
  { label: "Growth Quiz", to: "/growth-quiz" },
  { label: "Email Sequence Generator", to: "/email-generator" },
  { label: "Free Toolkits", to: "/free-resources" },
  { label: "Knowledge Base", to: "/knowledge-base" },
  { label: "Blog", to: "/blog" },
];

const LOCATIONS = [
  "Nigeria",
  "Hanover MD, USA",
  "Toulon, France",
  "Halle, Germany",
  "Cookhouse, South Africa",
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-5 py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <div className="flex items-baseline gap-0.5">
              <span className="font-display text-xl font-extrabold text-foreground">EmmaForYou</span>
              <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: "var(--gradient-gold)" }} />
            </div>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Helping businesses grow — from Lagos to the world.
            </p>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold mt-5 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm"
            >
              Chat on WhatsApp →
            </a>
          </div>

          <nav aria-label="Services">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">Services</h2>
            <div className="mt-4 flex flex-col gap-2.5">
              {SERVICE_LINKS.map((l) => (
                <Link key={l.slug} to="/services/$slug" params={{ slug: l.slug }} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  {l.label}
                </Link>
              ))}
              {EXPERTISE_LINKS.map((l) => (
                <Link key={l.slug} to="/expertise/$slug" params={{ slug: l.slug }} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  {l.label}
                </Link>
              ))}
            </div>
          </nav>

          <nav aria-label="Free tools and resources">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">Free Tools</h2>
            <div className="mt-4 flex flex-col gap-2.5">
              {TOOL_LINKS.map((l) => (
                <Link key={l.to} to={l.to} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  {l.label}
                </Link>
              ))}
            </div>
          </nav>

          <div>
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">Company</h2>
            <div className="mt-4 flex flex-col gap-2.5">
              {LINKS.map((l) => (
                <Link key={l.to} to={l.to} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">Locations</h2>
            <div className="mt-4 flex flex-col gap-2.5">
              {LOCATIONS.map((loc) => (
                <span key={loc} className="text-sm text-muted-foreground">{loc}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} EmmaForYou. All rights reserved.</span>
          <nav aria-label="Legal" className="flex gap-5">
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
