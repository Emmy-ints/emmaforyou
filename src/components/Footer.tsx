import { Link } from "@tanstack/react-router";

const WHATSAPP_URL = "https://wa.me/message/HHGMMWMRJFYUC1";

const LINKS = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Testimonials", to: "/testimonials" },
  { label: "Case Studies", to: "/cases" },
  { label: "Business Analyser", to: "/analyser" },
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
        <div className="grid gap-10 md:grid-cols-3">
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

          <div>
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">Quick Links</h4>
            <div className="mt-4 flex flex-col gap-2.5">
              {LINKS.map((l) => (
                <Link key={l.to} to={l.to} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">Locations</h4>
            <div className="mt-4 flex flex-col gap-2.5">
              {LOCATIONS.map((loc) => (
                <span key={loc} className="text-sm text-muted-foreground">{loc}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-14 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} EmmaForYou. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
