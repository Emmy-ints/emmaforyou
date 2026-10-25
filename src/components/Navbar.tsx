// @ts-nocheck -- generated DB/router types lag behind; runtime verified
import { Fragment, useState, useEffect, useCallback, useRef, useId, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  ArrowRight, ArrowUpRight, ChevronDown, X, Globe2, LayoutGrid, Bot, Workflow, Smartphone, Building2,
  BookOpen, Users, Wrench, Sparkles, Lock, BarChart3, MessageCircle, CalendarDays,
} from "lucide-react";
import LanguageSelector from "./LanguageSelector";
import DarkModeToggle from "./DarkModeToggle";
import Wordmark from "./brand/Wordmark";
import { useI18n } from "@/lib/i18n";
import { signOutEverywhere, useAccount } from "@/lib/auth/use-account";
import { SERVICES, EXPERTISE } from "@/lib/services-data";
import { SOLUTION_CATEGORIES } from "@/lib/solutions/categories";
import { canonicalForExpertise } from "@/lib/expertise-canonical";

const WHATSAPP_URL = "https://wa.me/message/HHGMMWMRJFYUC1";

type MenuKey = "solutions" | "services" | "resources" | "company" | "account";
type Item = { to: string; name: string; short?: string };

/* ------------------------------------------------------------------ information architecture */

const SOLUTION_ICONS: Record<string, typeof Globe2> = {
  websites: Globe2, "business-apps": LayoutGrid, "ai-solutions": Bot, automation: Workflow, "mobile-desktop": Smartphone, industries: Building2,
};

// Expertise pages that duplicate a /services page are left out (the service page is canonical).
const EXPERTISE_GROUPS: { title: string; slugs: string[] }[] = [
  { title: "Growth & marketing", slugs: ["lead-generation", "sales-conversion", "funnel-building", "copywriting", "social-media-automation", "seo", "analytics", "marketing-promotion", "conversion-rate-optimisation"] },
  { title: "Build & systems", slugs: ["website-landing-pages", "shopify-ecommerce", "wordpress", "ui-ux-design", "crm-systems", "app-development", "ai-automation"] },
  { title: "Strategy & Web3", slugs: ["digital-strategy", "business-consulting", "accountability-coaching", "web3-development", "smart-contract-development", "blockchain-crypto"] },
];
const expertiseItems = (slugs: string[]): Item[] =>
  slugs.map((slug) => EXPERTISE.find((e) => e.slug === slug)).filter((e): e is NonNullable<typeof e> => Boolean(e))
    .filter((e) => canonicalForExpertise(e.slug) === `/expertise/${e.slug}`)
    .map((e) => ({ to: `/expertise/${e.slug}`, name: e.name }));

const LEARN: Item[] = [
  { to: "/blog", name: "Blog", short: "Practical growth articles, updated daily" },
  { to: "/community", name: "Community", short: "Ask questions, share projects" },
  { to: "/knowledge-base", name: "Knowledge Base", short: "In-depth playbooks" },
  { to: "/checklists", name: "Free Checklists", short: "Website, CRO, Web3, launch" },
  { to: "/compare", name: "Comparisons", short: "Shopify vs Woo, SEO vs ads" },
  { to: "/inspiration", name: "Inspiration Library", short: "Real sites, stores and emails" },
  { to: "/free-resources", name: "Free Resources", short: "Templates and guides" },
  { to: "/faq", name: "FAQ", short: "Common questions answered" },
];

const TOOLS: Item[] = [
  { to: "/ecommerce", name: "Ecommerce Intelligence", short: "Start or grow an online store" },
  { to: "/website-audit", name: "Website Audit", short: "Speed, SEO and lead score" },
  { to: "/ai-receptionist", name: "AI Receptionist", short: "Chat or talk to the demo" },
  { to: "/makeover", name: "AI Website Makeover", short: "See your site redesigned" },
  { to: "/proposal", name: "Instant Proposal", short: "Plan and quote in seconds" },
  { to: "/smart-contract-check", name: "Smart Contract Check", short: "Solidity security review" },
  { to: "/goal-planner", name: "90-Day Goal Planner", short: "Goals into weekly actions" },
  { to: "/roi-calculator", name: "ROI Calculator", short: "Estimate your return" },
  { to: "/growth-quiz", name: "Growth Quiz", short: "Find your next step" },
  { to: "/email-generator", name: "Email Generator", short: "5-email sequences" },
  { to: "/analyser", name: "Growth Assessment", short: "Score your business" },
];

const COMPANY: Item[] = [
  { to: "/about", name: "About Us", short: "Our story and mission" },
  { to: "/why-emmaforyou", name: "Why EmmaForYou", short: "How we work differently" },
  { to: "/industries", name: "Industries", short: "Solutions for your sector" },
  { to: "/portfolio", name: "Portfolio", short: "Featured client work" },
  { to: "/cases", name: "Case Studies", short: "Real results" },
  { to: "/testimonials", name: "Testimonials", short: "What clients say" },
  { to: "/affiliate", name: "Affiliate Program", short: "Earn with us" },
  { to: "/intake", name: "Get Started", short: "Tell us about your project" },
  { to: "/contact", name: "Contact", short: "WhatsApp, call or message" },
];

// One EmmaForYou account opens all of these; the dashboard additionally needs the admin role.
const ACCOUNT: (Item & { icon: typeof Lock; adminOnly?: boolean })[] = [
  { to: "/portal", name: "Client Portal", short: "Projects, approvals, invoices and files", icon: Lock },
  { to: "/community", name: "Community", short: "Your profile, posts and messages", icon: Users },
  { to: "/dashboard", name: "Owner Dashboard", short: "Analytics, leads, bookings and clients", icon: BarChart3, adminOnly: true },
];

const SECTION_PATHS: Record<MenuKey, string[]> = {
  solutions: ["/solutions"],
  services: ["/services", "/expertise"],
  resources: [...LEARN.filter((i) => i.to !== "/community" && i.to !== "/blog").map((i) => i.to), "/tools", ...TOOLS.map((i) => i.to)],
  company: COMPANY.map((i) => i.to),
  account: ["/portal", "/dashboard", "/account", "/login"],
};

/* ------------------------------------------------------------------ component */

export default function Navbar() {
  const { t } = useI18n();
  const account = useAccount();
  const signedIn = account.ready && account.signedIn;
  const accountItems = ACCOUNT.filter((a) => !a.adminOnly || !signedIn || account.summary?.admin);
  const pathname = useRouterState({ select: (st) => st.location.pathname });
  const onInkHero = pathname === "/" || pathname.startsWith("/services/") || pathname.startsWith("/expertise/") || pathname.startsWith("/portfolio") || /^\/(fr|de)$/.test(pathname);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [open, setOpen] = useState<MenuKey | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<MenuKey | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  const hoveredAt = useRef(0);
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const showProgress = /^\/(blog|knowledge-base|checklists|compare)\/[^/]+$/.test(pathname);

  // Scroll state: background/shadow change only (the bar never hides or changes height).
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(y > 8);
        if (showProgress) {
          const max = document.documentElement.scrollHeight - window.innerHeight;
          setProgress(max > 0 ? Math.min(1, y / max) : 0);
        }
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, [showProgress]);

  // The homepage "choose a language" tool opens the language menu; on small screens it lives in the drawer.
  useEffect(() => {
    const onOpenLang = () => { if (window.innerWidth < 1280) setMobileOpen(true); };
    window.addEventListener("efy-open-lang", onOpenLang);
    return () => window.removeEventListener("efy-open-lang", onOpenLang);
  }, []);

  // Close everything on navigation.
  useEffect(() => { setOpen(null); setMobileOpen(false); setMobileSection(null); }, [pathname]);

  // Desktop menus: Escape closes and returns focus to the trigger; a click outside closes.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const key = open;
      setOpen(null);
      document.getElementById(`${uid}-${key}-btn`)?.focus();
    };
    const onDown = (e: MouseEvent) => { if (barRef.current && !barRef.current.contains(e.target as Node)) setOpen(null); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onDown); };
  }, [open, uid]);

  // Mobile drawer: lock page scroll, trap focus, Escape closes, focus returns to the menu button.
  useEffect(() => {
    if (!mobileOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusables = () => Array.from(drawerRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? []);
    requestAnimationFrame(() => focusables()[0]?.focus());
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); setMobileOpen(false); return; }
      if (e.key !== "Tab") return;
      const f = focusables(); if (!f.length) return;
      const first = f[0], last = f[f.length - 1], active = document.activeElement;
      if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = original; triggerRef.current?.focus(); };
  }, [mobileOpen]);

  const isActive = (prefixes: string[]) => prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const hoverOpen = (key: MenuKey) => (e: React.PointerEvent) => { if (e.pointerType !== "mouse") return; window.clearTimeout(closeTimer.current); if (open !== key) hoveredAt.current = Date.now(); setOpen(key); };
  const hoverClose = (e: React.PointerEvent) => { if (e.pointerType !== "mouse") return; window.clearTimeout(closeTimer.current); closeTimer.current = window.setTimeout(() => setOpen(null), 140); };
  const close = useCallback(() => setOpen(null), []);
  const ink = onInkHero && !scrolled && !mobileOpen;

  /* ---------------- desktop pieces */

  const Trigger = ({ k, label }: { k: MenuKey; label: string }) => (
    <button
      id={`${uid}-${k}-btn`}
      type="button"
      aria-expanded={open === k}
      aria-controls={`${uid}-${k}-panel`}
      // A click right after hover opened the menu keeps it open instead of toggling it shut.
      onClick={() => { if (open === k && Date.now() - hoveredAt.current < 600) return; setOpen(open === k ? null : k); }}
      onPointerEnter={hoverOpen(k)}
      onPointerLeave={hoverClose}
      onKeyDown={(e) => {
        if (e.key === "ArrowDown") { e.preventDefault(); setOpen(k); requestAnimationFrame(() => document.querySelector<HTMLElement>(`#${uid}-${k}-panel a`)?.focus()); }
      }}
      className={`nav-link ${open === k ? "is-open" : ""} ${isActive(SECTION_PATHS[k]) ? "is-active" : ""}`}
    >
      {label}
      <ChevronDown className="nav-chevron h-3.5 w-3.5" aria-hidden="true" />
    </button>
  );

  const Panel = ({ k, align = "center", width, children }: { k: MenuKey; align?: "center" | "end"; width: string; children: ReactNode }) =>
    open === k ? (
      <div
        id={`${uid}-${k}-panel`}
        role="region"
        aria-labelledby={`${uid}-${k}-btn`}
        onPointerEnter={hoverOpen(k)}
        onPointerLeave={hoverClose}
        className={`nav-panel ${align === "end" ? "right-4 sm:right-5" : "left-1/2 -translate-x-1/2"} ${width}`}
      >
        {children}
      </div>
    ) : null;

  const MenuLink = ({ item, compact = false }: { item: Item; compact?: boolean }) => (
    <Link to={item.to} onClick={close} aria-current={pathname === item.to ? "page" : undefined} className={`nav-menu-link ${compact ? "py-1.5" : "py-2"}`}>
      <span className="block text-[0.86rem] font-medium text-foreground">{item.name}</span>
      {!compact && item.short && <span className="mt-0.5 block text-[0.76rem] leading-snug text-muted-foreground">{item.short}</span>}
    </Link>
  );

  const Heading = ({ children }: { children: ReactNode }) => <p className="nav-menu-heading">{children}</p>;

  const PlainLink = ({ to, label, match }: { to: string; label: string; match: (p: string) => boolean }) => (
    <Link to={to} aria-current={match(pathname) ? "page" : undefined} className={`nav-link ${match(pathname) ? "is-active" : ""}`}>{label}</Link>
  );

  /* ---------------- mobile pieces */

  const MobileGroup = ({ k, label, children }: { k: MenuKey; label: string; children: ReactNode }) => (
    <div className="border-b border-border/70">
      <button type="button" aria-expanded={mobileSection === k} aria-controls={`${uid}-m-${k}`} onClick={() => setMobileSection(mobileSection === k ? null : k)}
        className="flex min-h-[52px] w-full items-center justify-between text-left font-display text-[1.02rem] font-semibold tracking-[-0.01em] text-foreground">
        {label}
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${mobileSection === k ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      <div id={`${uid}-m-${k}`} hidden={mobileSection !== k} className="pb-3">{children}</div>
    </div>
  );
  const MobileLink = ({ to, label, hint }: { to: string; label: string; hint?: string }) => (
    <Link to={to} onClick={() => setMobileOpen(false)} aria-current={pathname === to ? "page" : undefined} className="nav-mobile-link">
      <span className="block text-[0.92rem] font-medium text-foreground">{label}</span>
      {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
    </Link>
  );
  const MobileTop = ({ to, label, badge }: { to: string; label: string; badge?: string }) => (
    <Link to={to} onClick={() => setMobileOpen(false)} aria-current={pathname === to || (to !== "/" && pathname.startsWith(`${to}/`)) ? "page" : undefined}
      className="flex min-h-[52px] items-center justify-between border-b border-border/70 font-display text-[1.02rem] font-semibold tracking-[-0.01em] text-foreground">
      {label}
      {badge ? <span className="rounded-full bg-[var(--emma-violet)]/10 px-2 py-0.5 font-body text-[11px] font-semibold text-[var(--emma-violet)]">{badge}</span> : <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
    </Link>
  );

  return (
    <>
      <header className={`site-header ${scrolled ? "is-scrolled" : ""} ${ink ? "nav-on-ink is-ink" : ""}`}>
        <a href="#main-content" onClick={(e) => { const m = document.querySelector("main"); if (!m) return; e.preventDefault(); m.setAttribute("tabindex", "-1"); m.focus(); m.scrollIntoView(); }}
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-[200] focus:rounded-full focus:bg-[var(--emma-violet)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white">Skip to content</a>

        <div ref={barRef} className="relative mx-auto flex h-[68px] max-w-[1320px] items-center gap-3 px-4 sm:px-5 lg:h-[72px] lg:px-6">
          {/* Left: brand */}
          <Link to="/" aria-label="EmmaForYou, home" className="nav-brand flex shrink-0 items-center rounded-lg">
            <Wordmark />
          </Link>

          {/* Centre: primary navigation (desktop) */}
          <nav aria-label="Main" className="hidden flex-1 justify-center xl:flex">
            <ul className="flex items-center gap-0.5">
              <li>{Trigger({ k: "solutions", label: "Solutions" })}</li>
              <li>{Trigger({ k: "services", label: "Services" })}</li>
              <li>{Trigger({ k: "resources", label: "Resources" })}</li>
              <li>{PlainLink({ to: "/community", label: "Community", match: (p) => p.startsWith("/community") })}</li>
              <li>{PlainLink({ to: "/blog", label: "Blog", match: (p) => p === "/blog" || p.startsWith("/blog/") })}</li>
              <li>{Trigger({ k: "company", label: "Company" })}</li>
              <li>{PlainLink({ to: "/pricing", label: "Pricing", match: (p) => p === "/pricing" })}</li>
            </ul>
          </nav>

          {/* Right: utilities + conversion (desktop) */}
          <div className="ml-auto hidden items-center gap-1.5 xl:flex">
            <LanguageSelector />
            <DarkModeToggle />
            <span className="mx-1.5 h-5 w-px bg-border" aria-hidden="true" />
            {Trigger({ k: "account", label: signedIn ? "Account" : "Log in" })}
            <Link to="/book" className="nav-cta group ml-1.5" aria-label="Book a consultation">
              <span className="2xl:hidden">Book a call</span><span className="hidden 2xl:inline">Book a consultation</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>

          {/* Right: compact bar (phones and tablets) */}
          <div className="ml-auto flex items-center gap-1.5 xl:hidden">
            <div className="hidden items-center gap-1.5 md:flex"><LanguageSelector /><DarkModeToggle /></div>
            <Link to="/book" className="nav-cta nav-cta-sm hidden min-[480px]:inline-flex">Book a call</Link>
            <button ref={triggerRef} type="button" onClick={() => setMobileOpen(true)} aria-label="Open menu" aria-expanded={mobileOpen} aria-controls={`${uid}-drawer`} className="nav-burger">
              <span /><span /><span />
            </button>
          </div>

          {/* Mega menus */}
          {Panel({ k: "solutions", width: "w-[880px] max-w-[calc(100vw-32px)]", children: <>
            <div className="grid grid-cols-[1fr_250px] gap-2">
              <div className="grid grid-cols-2 gap-1 p-1">
                {SOLUTION_CATEGORIES.map((c) => {
                  const Icon = SOLUTION_ICONS[c.slug] ?? Sparkles;
                  return (
                    <Link key={c.slug} to="/solutions/$category" params={{ category: c.slug }} onClick={close} aria-current={pathname === `/solutions/${c.slug}` ? "page" : undefined} className="nav-menu-link flex items-start gap-3 py-2.5">
                      <span className="nav-icon-tile"><Icon className="h-4 w-4" aria-hidden="true" /></span>
                      <span><span className="block text-[0.88rem] font-semibold text-foreground">{c.slug === "ai-solutions" ? "AI Agents & Solutions" : c.name}</span><span className="mt-0.5 block text-[0.76rem] leading-snug text-muted-foreground">{c.short}</span></span>
                    </Link>
                  );
                })}
              </div>
              <aside className="nav-feature">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--emma-violet)]">Try before you hire</p>
                <p className="mt-2 font-display text-[0.98rem] font-semibold leading-snug text-foreground">Every solution has a live demo you can customise.</p>
                <div className="mt-4 flex flex-col gap-1.5">
                  <Link to="/solutions" onClick={close} className="nav-feature-link">Browse all solutions <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
                  <Link to="/solutions/ai-solutions" onClick={close} className="nav-feature-link">AI agents <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
                  <Link to="/solutions/app-planner" onClick={close} className="nav-feature-link">App feature planner <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
                </div>
              </aside>
            </div>
          </> })}

          {Panel({ k: "services", width: "w-[1040px] max-w-[calc(100vw-32px)]", children: <>
            <div className="grid grid-cols-[1.1fr_1fr_1fr_1fr] gap-2 p-1">
              <div className="rounded-xl bg-muted/50 p-2">
                {Heading({ children: <>Core services</> })}
                {SERVICES.map((s) => <Fragment key={s.slug}>{MenuLink({ item: { to: `/services/${s.slug}`, name: s.name, short: s.short } })}</Fragment>)}
                <Link to="/services" onClick={close} className="nav-feature-link mt-1 px-3">All services <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
              </div>
              {EXPERTISE_GROUPS.map((g) => (
                <div key={g.title} className="p-2">
                  {Heading({ children: <>{g.title}</> })}
                  {expertiseItems(g.slugs).map((i) => <Fragment key={i.to}>{MenuLink({ item: i, compact: true })}</Fragment>)}
                </div>
              ))}
            </div>
          </> })}

          {Panel({ k: "resources", width: "w-[860px] max-w-[calc(100vw-32px)]", children: <>
            <div className="grid grid-cols-[1fr_1.35fr] gap-2 p-1">
              <div className="p-2">
                {Heading({ children: <>Learn</> })}
                {LEARN.map((i) => <Fragment key={i.to}>{MenuLink({ item: i })}</Fragment>)}
              </div>
              <div className="rounded-xl bg-muted/50 p-2">
                <div className="flex items-center justify-between pr-2">{Heading({ children: <>Free tools</> })}<Link to="/tools" onClick={close} className="nav-feature-link text-xs">All tools <ArrowRight className="h-3 w-3" aria-hidden="true" /></Link></div>
                <div className="grid grid-cols-2">{TOOLS.map((i) => <Fragment key={i.to}>{MenuLink({ item: i })}</Fragment>)}</div>
              </div>
            </div>
          </> })}

          {Panel({ k: "company", width: "w-[720px] max-w-[calc(100vw-32px)]", children: <>
            <div className="grid grid-cols-[1fr_230px] gap-2">
              <div className="grid grid-cols-2 p-1">{COMPANY.map((i) => <Fragment key={i.to}>{MenuLink({ item: i })}</Fragment>)}</div>
              <aside className="nav-feature">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--emma-violet)]">Talk to us</p>
                <p className="mt-2 font-display text-[0.98rem] font-semibold leading-snug text-foreground">A free 30-minute strategy call, or a quick WhatsApp chat.</p>
                <div className="mt-4 flex flex-col gap-1.5">
                  <Link to="/book" onClick={close} className="nav-feature-link"><CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />Book a call</Link>
                  <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" onClick={close} className="nav-feature-link"><MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />{t("cta_waitlist")} on WhatsApp <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /></a>
                </div>
              </aside>
            </div>
          </> })}

          {Panel({ k: "account", align: "end", width: "w-[340px]", children: <>
            <div className="p-1">
              {signedIn ? (
                <div className="mb-1 rounded-xl bg-muted/50 px-3 py-2.5">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Signed in as</p>
                  <p className="mt-0.5 truncate text-[0.88rem] font-semibold text-foreground">{account.email}</p>
                  <Link to="/account" onClick={close} className="nav-feature-link mt-1">Your account <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
                </div>
              ) : (
                <div className="mb-1 grid grid-cols-2 gap-1.5 p-1">
                  <Link to="/login" onClick={close} className="nav-cta nav-cta-sm justify-center">Sign in</Link>
                  <Link to="/login" search={{ mode: "signup" }} onClick={close} className="nav-ghost h-9 justify-center text-[0.8125rem]">Create account</Link>
                  <p className="col-span-2 px-1 pt-1 text-[0.74rem] leading-snug text-muted-foreground">One account for the community, client portal and dashboard.</p>
                </div>
              )}
              {accountItems.map((a) => {
                const Icon = a.icon;
                return (
                  <Link key={a.to} to={a.to} onClick={close} aria-current={pathname === a.to ? "page" : undefined} className="nav-menu-link flex items-start gap-3 py-2.5">
                    <span className="nav-icon-tile"><Icon className="h-4 w-4" aria-hidden="true" /></span>
                    <span><span className="block text-[0.88rem] font-semibold text-foreground">{a.name}</span><span className="mt-0.5 block text-[0.76rem] leading-snug text-muted-foreground">{a.short}</span></span>
                  </Link>
                );
              })}
              {signedIn && <button type="button" onClick={async () => { close(); await signOutEverywhere("local"); }} className="nav-menu-link mt-1 w-full py-2 text-left text-[0.86rem] font-medium text-muted-foreground hover:text-foreground">Sign out</button>}
            </div>
          </> })}
        </div>

        <div className="nav-hairline" aria-hidden="true" />
        {showProgress && scrolled && <div aria-hidden="true" className="nav-progress" style={{ transform: `scaleX(${progress})` }} />}
      </header>

      {/* Mobile and tablet drawer */}
      <div onClick={() => setMobileOpen(false)} aria-hidden="true" className={`nav-scrim xl:hidden ${mobileOpen ? "is-open" : ""}`} />
      <div id={`${uid}-drawer`} ref={drawerRef} role="dialog" aria-modal="true" aria-label="Site menu" inert={!mobileOpen} aria-hidden={!mobileOpen}
        className={`nav-drawer xl:hidden ${mobileOpen ? "is-open" : ""}`}>
        <div className="flex h-[68px] shrink-0 items-center justify-between border-b border-border/70 px-5">
          <Link to="/" onClick={() => setMobileOpen(false)} aria-label="EmmaForYou, home" className="rounded-lg"><Wordmark size="sm" /></Link>
          <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close menu" className="nav-chip flex h-10 w-10 items-center justify-center rounded-full text-foreground"><X className="h-5 w-5" aria-hidden="true" /></button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-5">
          <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
            <Link to="/book" onClick={() => setMobileOpen(false)} className="nav-cta justify-center">Book a consultation</Link>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" onClick={() => setMobileOpen(false)} className="nav-ghost justify-center"><MessageCircle className="h-4 w-4" aria-hidden="true" />WhatsApp us</a>
          </div>

          <nav aria-label="Site sections" className="mt-5">
            {MobileTop({ to: "/", label: t("nav_home") })}
            {MobileGroup({ k: "solutions", label: "Solutions", children: <>
              {MobileLink({ to: "/solutions", label: "All solutions", hint: "Live demos you can customise" })}
              {SOLUTION_CATEGORIES.map((c) => <Fragment key={c.slug}>{MobileLink({ to: `/solutions/${c.slug}`, label: c.slug === "ai-solutions" ? "AI Agents & Solutions" : c.name })}</Fragment>)}
              {MobileLink({ to: "/solutions/app-planner", label: "App feature planner" })}
            </> })}
            {MobileGroup({ k: "services", label: "Services", children: <>
              {MobileLink({ to: "/services", label: "All services" })}
              {SERVICES.map((s) => <Fragment key={s.slug}>{MobileLink({ to: `/services/${s.slug}`, label: s.name })}</Fragment>)}
              {EXPERTISE_GROUPS.map((g) => (
                <div key={g.title} className="mt-2">
                  <p className="nav-menu-heading px-3">{g.title}</p>
                  {expertiseItems(g.slugs).map((i) => <Fragment key={i.to}>{MobileLink({ to: i.to, label: i.name })}</Fragment>)}
                </div>
              ))}
            </> })}
            {MobileTop({ to: "/community", label: "Community", badge: "Ask & share" })}
            {MobileTop({ to: "/blog", label: "Blog" })}
            {MobileGroup({ k: "resources", label: "Resources & tools", children: <>
              {LEARN.filter((i) => i.to !== "/community" && i.to !== "/blog").map((i) => <Fragment key={i.to}>{MobileLink({ to: i.to, label: i.name })}</Fragment>)}
              <p className="nav-menu-heading mt-2 px-3"><Wrench className="mr-1 inline h-3 w-3" aria-hidden="true" />Free tools</p>
              {MobileLink({ to: "/tools", label: "All free tools" })}
              {TOOLS.map((i) => <Fragment key={i.to}>{MobileLink({ to: i.to, label: i.name })}</Fragment>)}
            </> })}
            {MobileGroup({ k: "company", label: "Company", children: <>
              {COMPANY.map((i) => <Fragment key={i.to}>{MobileLink({ to: i.to, label: i.name })}</Fragment>)}
            </> })}
            {MobileTop({ to: "/pricing", label: "Pricing" })}
          </nav>

          <section aria-label="Your account" className="mt-6 rounded-2xl border border-border bg-card p-3.5">
            {signedIn ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Signed in as</p>
                <p className="mt-0.5 truncate text-sm font-semibold text-foreground">{account.email}</p>
                <div className="mt-3 grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
                  <Link to="/account" onClick={() => setMobileOpen(false)} className="nav-ghost justify-center">Your account</Link>
                  <button type="button" onClick={async () => { setMobileOpen(false); await signOutEverywhere("local"); }} className="nav-ghost justify-center">Sign out</button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">One account for the community, client portal and dashboard.</p>
                <div className="mt-3 grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="nav-cta justify-center">Sign in</Link>
                  <Link to="/login" search={{ mode: "signup" }} onClick={() => setMobileOpen(false)} className="nav-ghost justify-center">Create account</Link>
                </div>
              </>
            )}
            <div className="mt-3 grid gap-1 border-t border-border/70 pt-2">
              {accountItems.map((a) => <Link key={a.to} to={a.to} onClick={() => setMobileOpen(false)} className="nav-mobile-link"><span className="block text-[0.92rem] font-medium text-foreground">{a.name}</span><span className="block text-xs text-muted-foreground">{a.short}</span></Link>)}
            </div>
          </section>

          <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-3.5 py-3">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Display</span>
            <div className="flex items-center gap-2"><LanguageSelector /><DarkModeToggle /></div>
          </div>
        </div>
      </div>
    </>
  );
}
