import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, MessageCircle, CalendarDays } from "lucide-react";
import NewsletterSignup from "./NewsletterSignup";
import Wordmark from "./brand/Wordmark";
import { SOLUTION_CATEGORIES } from "@/lib/solutions/categories";
import { SERVICES } from "@/lib/services-data";
import { useAccount } from "@/lib/auth/use-account";

/**
 * The site-wide footer (rendered by the shared page layouts, never per page). Midnight band using
 * the brand tokens; every link points to an existing route. Contact is WhatsApp and the booking
 * page only: no social profiles or email addresses are listed because none are verified.
 */
const WHATSAPP_URL = "https://wa.me/message/HHGMMWMRJFYUC1";

type L = { to: string; label: string; search?: Record<string, string> };
const COMPANY: L[] = [
  { to: "/about", label: "About EmmaForYou" },
  { to: "/why-emmaforyou", label: "Why EmmaForYou" },
  { to: "/portfolio", label: "Portfolio" },
  { to: "/cases", label: "Case studies" },
  { to: "/testimonials", label: "Testimonials" },
  { to: "/pricing", label: "Pricing" },
  { to: "/contact", label: "Contact" },
];
const RESOURCES: L[] = [
  { to: "/community", label: "Community" },
  { to: "/blog", label: "Blog" },
  { to: "/knowledge-base", label: "Knowledge base" },
  { to: "/ecommerce", label: "Ecommerce Intelligence" },
  { to: "/publishing", label: "Book publishing tools" },
  { to: "/tools", label: "Free tools" },
  { to: "/inspiration", label: "Inspiration library" },
  { to: "/free-resources", label: "Free resources" },
  { to: "/watch", label: "How we work (video)" },
  { to: "/newsletter", label: "Newsletter" },
  { to: "/faq", label: "FAQ" },
];
const LOCATIONS: { label: string; to?: string; lang?: string }[] = [
  { label: "Lagos, Nigeria" },
  { label: "Hanover MD, USA" },
  { label: "Toulon, France", to: "/fr", lang: "fr" },
  { label: "Halle, Germany", to: "/de", lang: "de" },
  { label: "Cookhouse, South Africa" },
];

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <nav aria-label={title} className="min-w-0">
      <h2 className="footer-heading">{title}</h2>
      <ul className="mt-4 space-y-0.5">{children}</ul>
    </nav>
  );
}
function FLink({ l }: { l: L }) {
  return <li><Link to={l.to} search={l.search} className="footer-link">{l.label}</Link></li>;
}

export default function Footer() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { ready, signedIn, summary } = useAccount();
  const showSignup = !["/newsletter", "/unsubscribe"].includes(pathname) && !/^\/(fr|de)(\/|$)/.test(pathname);
  const showClosing = !/^\/(book|contact|intake|login|account|portal|dashboard|community|unsubscribe)(\/|$)/.test(pathname);
  const account: L[] = ready && signedIn
    ? [{ to: "/account", label: "Your account" }, { to: "/portal", label: "Client portal" }, { to: "/community/settings", label: "Community profile" }, ...(summary?.admin ? [{ to: "/dashboard", label: "Owner dashboard" }] : [])]
    : [{ to: "/login", label: "Sign in" }, { to: "/login", label: "Create account", search: { mode: "signup" } }, { to: "/login", label: "Forgot password", search: { mode: "forgot" } }, { to: "/portal", label: "Client portal" }];

  return (
    <footer className="site-footer band-ink">
      <div aria-hidden="true" className="footer-glow" />
      <div className="relative mx-auto max-w-7xl px-5 pb-8 pt-14 sm:px-6 md:pt-16 lg:px-8">
        {showClosing && (
          <section aria-labelledby="footer-closing" className="lg-strong relative mb-14 overflow-hidden rounded-[32px] px-6 py-12 sm:px-10 md:py-16" style={{ background: "linear-gradient(150deg, rgba(255,255,255,.07), rgba(255,255,255,.015))" }}>
            <div aria-hidden="true" className="efy-orb -right-24 -top-24 w-[340px] opacity-80 md:-right-10 md:w-[420px]"><div className="efy-orb-fallback" /></div>
            <div className="relative max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--emma-cyan)]">Your next chapter</p>
              <h2 id="footer-closing" className="mt-3 font-display text-3xl font-semibold leading-[1.05] tracking-tight text-foreground md:text-5xl">Let's build what your customers see next.</h2>
              <p className="mt-4 max-w-xl text-muted-foreground">A free 30-minute strategy call: we look at how customers find you, contact you and buy from you today, and map the next steps.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link to="/book" className="btn-gold inline-flex min-h-11 items-center gap-2 rounded-full px-6 py-3 text-[15px]"><CalendarDays className="h-4 w-4" aria-hidden="true" />Book a free call</Link>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="hero-ghost-btn"><MessageCircle className="h-4 w-4" aria-hidden="true" />Chat on WhatsApp<span className="sr-only"> (opens in a new tab)</span></a>
              </div>
            </div>
          </section>
        )}
        {showSignup && <div className="mb-14"><NewsletterSignup source="footer" variant="band" /></div>}

        <div className="flex flex-col gap-12">
          {/* Brand */}
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-md">
            <Link to="/" aria-label="EmmaForYou, home" className="inline-flex rounded-lg"><Wordmark /></Link>
            <p className="mt-5 font-display text-[1.05rem] font-semibold leading-snug text-foreground">Helping businesses grow — from Lagos to the world.</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Websites, business apps, AI and automation, designed and built to help businesses win more customers and run more smoothly.</p>
          </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="footer-cta"><MessageCircle className="h-4 w-4" aria-hidden="true" />Chat on WhatsApp<ArrowUpRight className="h-3.5 w-3.5 opacity-70" aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a>
              <Link to="/book" className="footer-ghost"><CalendarDays className="h-4 w-4" aria-hidden="true" />Book a call</Link>
            </div>
          </div>

          {/* Navigation */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 border-t border-border pt-10 sm:grid-cols-3 lg:grid-cols-5">
            <Column title="Solutions">
              {SOLUTION_CATEGORIES.map((c) => <li key={c.slug}><Link to="/solutions/$category" params={{ category: c.slug }} className="footer-link">{c.slug === "ai-solutions" ? "AI Solutions" : c.slug === "mobile-desktop" ? "Mobile & Desktop Apps" : c.name}</Link></li>)}
              <li><Link to="/solutions" className="footer-link footer-link-strong">All solutions <ArrowRight className="h-3 w-3" aria-hidden="true" /></Link></li>
            </Column>
            <Column title="Services">
              {SERVICES.map((s) => <li key={s.slug}><Link to="/services/$slug" params={{ slug: s.slug }} className="footer-link">{s.name}</Link></li>)}
              <li><Link to="/services" className="footer-link footer-link-strong">All services <ArrowRight className="h-3 w-3" aria-hidden="true" /></Link></li>
            </Column>
            <Column title="Company">{COMPANY.map((l) => <FLink key={l.to} l={l} />)}</Column>
            <Column title="Resources">{RESOURCES.map((l) => <FLink key={l.to} l={l} />)}</Column>
            <Column title="Account">{account.map((l) => <FLink key={l.label} l={l} />)}</Column>
          </div>
        </div>

        <div className="mt-14 border-t border-border pt-6">
          <ul aria-label="Where we work" className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
            {LOCATIONS.map((loc) => (
              <li key={loc.label} className="inline-flex items-center gap-1.5">
                <span aria-hidden="true" className="h-1 w-1 rounded-full bg-[var(--emma-violet)]" />
                {loc.to ? <Link to={loc.to} hrefLang={loc.lang} className="footer-link-inline">{loc.label} · {loc.lang?.toUpperCase()}</Link> : loc.label}
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-col-reverse gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} EmmaForYou. All rights reserved.</p>
            <nav aria-label="Legal"><ul className="flex flex-wrap gap-x-5 gap-y-1">
              <li><Link to="/privacy" className="footer-link-inline">Privacy policy</Link></li>
              <li><Link to="/terms" className="footer-link-inline">Terms of service</Link></li>
              <li><Link to="/cookies" className="footer-link-inline">Cookie policy</Link></li>
            </ul></nav>
          </div>
        </div>
      </div>
      <p aria-hidden="true" className="pointer-events-none select-none overflow-hidden text-center font-display text-[18vw] font-bold leading-[0.8] tracking-[-0.06em] text-transparent opacity-60 [-webkit-text-stroke:1px_rgba(139,123,255,.22)] md:text-[13vw]">EmmaForYou</p>
    </footer>
  );
}
