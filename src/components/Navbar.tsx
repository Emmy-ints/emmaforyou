import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useLocation, useRouterState } from "@tanstack/react-router";
import LanguageSelector from "./LanguageSelector";
import DarkModeToggle from "./DarkModeToggle";
import { useI18n } from "@/lib/i18n";
import { SERVICES, EXPERTISE } from "@/lib/services-data";
import { SOLUTION_CATEGORIES } from "@/lib/solutions/categories";

const WHATSAPP_URL = "https://wa.me/message/HHGMMWMRJFYUC1";

type DropdownKey = "services" | "solutions" | "expertise" | "resources" | "tools" | "company" | "account";

const RESOURCES = [
  { to: "/blog", name: "Blog", icon: "📝", short: "Growth insights & guides" },
  { to: "/knowledge-base", name: "Knowledge Base", icon: "📚", short: "Deep playbooks" },
  { to: "/checklists", name: "Free Checklists", icon: "✅", short: "Website, CRO, Web3, launch" },
  { to: "/compare", name: "Comparisons", icon: "⚖️", short: "Shopify vs Woo, SEO vs ads…" },
  { to: "/free-resources", name: "Free Resources", icon: "🎁", short: "Templates & lead magnets" },
  { to: "/faq", name: "FAQ", icon: "❓", short: "Common questions" },
];

const TOOLS = [
  { to: "/tools", name: "All Free Tools", icon: "🧰", short: "Every tool in one place" },
  { to: "/website-audit", name: "Website Audit", icon: "🩺", short: "Speed, SEO & lead score" },
  { to: "/ai-receptionist", name: "AI Receptionist Demo", icon: "🤖", short: "Chat or talk to it" },
  { to: "/makeover", name: "AI Website Makeover", icon: "🎨", short: "See your site redesigned" },
  { to: "/proposal", name: "Instant Proposal", icon: "📝", short: "Your plan & quote in 20s" },
  { to: "/book", name: "Book a Call", icon: "📅", short: "Free 30-min strategy call" },
  { to: "/smart-contract-check", name: "Smart Contract Check", icon: "🛡️", short: "Free Solidity security review" },
  { to: "/goal-planner", name: "90-Day Goal Planner", icon: "🎯", short: "Goals into weekly actions" },
  { to: "/roi-calculator", name: "ROI Calculator", icon: "🧮", short: "Estimate your return" },
  { to: "/growth-quiz", name: "Growth Quiz", icon: "🎯", short: "Find your next step" },
  { to: "/email-generator", name: "Email Generator", icon: "✉️", short: "5-email sequences, AI-assisted" },
  { to: "/analyser", name: "Growth Assessment", icon: "🔬", short: "Score your business" },
];

const ACCOUNT = [
  { to: "/portal", name: "Client Portal", icon: "🔐", short: "Projects, approvals, invoices, files & messages" },
  { to: "/dashboard", name: "Dashboard", icon: "📊", short: "Owner: analytics, leads, bookings & clients" },
  { to: "/book", name: "Book a Call", icon: "📅", short: "Free 30-minute strategy call" },
];

const COMPANY = [
  { to: "/about", name: "About Us", icon: "👋", short: "Our story & mission" },
  { to: "/why-emmaforyou", name: "Why EmmaForYou", icon: "⭐", short: "How we work differently" },
  { to: "/industries", name: "Industries", icon: "🏢", short: "Solutions for your sector" },
  { to: "/portfolio", name: "Portfolio", icon: "💼", short: "Featured client work" },
  { to: "/cases", name: "Case Studies", icon: "📈", short: "Real results" },
  { to: "/testimonials", name: "Testimonials", icon: "⭐", short: "What clients say" },
  { to: "/affiliate", name: "Affiliate Program", icon: "🤝", short: "Earn with us" },
  { to: "/intake", name: "Get Started", icon: "🚀", short: "Project intake" },
  { to: "/contact", name: "Contact", icon: "✉️", short: "WhatsApp, call or message" },
];

export default function Navbar() {
  const { t } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const pathname = useRouterState({ select: (st) => st.location.pathname });
  const onInkHero = pathname === "/" || pathname.startsWith("/services/") || pathname.startsWith("/expertise/") || pathname.startsWith("/portfolio") || /^\/(fr|de)$/.test(pathname);
  const [hidden, setHidden] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<null | DropdownKey>(null);
  const [mobileSection, setMobileSection] = useState<DropdownKey | null>(null);
  const [lastY, setLastY] = useState(0);
  const location = useLocation();
  const drawerRef = useRef<HTMLElement | null>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const [progress, setProgress] = useState(0);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const handleScroll = useCallback(() => {
    const y = window.scrollY;
    setScrolled(y > 20);
    // Keep the header visible while a menu is open.
    setHidden(y > lastY && y > 100 && !openDropdown);
    setLastY(y);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    setProgress(max > 0 ? Math.min(1, y / max) : 0);
  }, [lastY, openDropdown]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    setMobileOpen(false);
    setMobileSection(null);
    setOpenDropdown(null);
  }, [location.pathname]);

  // Desktop menus: close with Escape or a click elsewhere.
  useEffect(() => {
    if (!openDropdown) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpenDropdown(null); };
    const onDown = (e: MouseEvent) => { if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenDropdown(null); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onDown); };
  }, [openDropdown]);

  const isActive = (prefixes: string[]) => prefixes.some((p) => (p === "/" ? pathname === "/" : pathname === p || pathname.startsWith(`${p}/`)));
  const SECTION_PATHS: Record<DropdownKey, string[]> = {
    services: ["/services"],
    solutions: ["/solutions"],
    expertise: ["/expertise"],
    company: COMPANY.map((c) => c.to),
    resources: RESOURCES.map((c) => c.to),
    tools: TOOLS.map((c) => c.to),
    account: ["/portal", "/dashboard"],
  };

  useEffect(() => {
    if (!mobileOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const getFocusable = () => {
      const root = drawerRef.current;
      if (!root) return [] as HTMLElement[];
      return Array.from(root.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'));
    };
    requestAnimationFrame(() => getFocusable()[0]?.focus());
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); setMobileOpen(false); return; }
      if (e.key !== "Tab") return;
      const f = getFocusable(); if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = originalOverflow;
      previouslyFocused?.focus?.();
    };
  }, [mobileOpen]);

  // Keep a menu panel inside the viewport: it is centred on its button, then nudged (CSS `translate`) if it would overflow.
  const fitPanel = useCallback((el: HTMLDivElement | null) => {
    if (!el || el.parentElement?.classList.contains("nav-pop-r")) return;
    const anchor = el.closest("[data-nav-anchor]");
    if (!anchor) return;
    const a = anchor.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const w = el.offsetWidth;
    const left = a.left + a.width / 2 - w / 2;
    const clamped = Math.min(Math.max(left, 12), Math.max(12, vw - 12 - w));
    el.style.setProperty("--nav-shift", `${Math.round(clamped - left)}px`);
  }, []);

  const dropdownPanel = (items: { to: string; name: string; icon: string; short: string }[], cols: 1 | 2 = 1, width = "w-[340px]") => (
    <div ref={fitPanel} className={`nav-pop absolute left-1/2 top-full z-50 mt-2 ${width} max-w-[calc(100vw-24px)] -translate-x-1/2 rounded-2xl border border-border bg-background p-2 shadow-xl grid gap-1`} style={{ gridTemplateColumns: cols === 2 ? "1fr 1fr" : "1fr" }}>
      {items.map((it) => (
        <Link key={it.to} to={it.to} onClick={() => setOpenDropdown(null)} aria-current={pathname === it.to ? "page" : undefined} className="nav-item group/item flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-muted focus-visible:bg-muted">
          <span className="text-lg transition-transform duration-200 group-hover/item:scale-110" aria-hidden="true">{it.icon}</span>
          <div>
            <div className="text-sm font-semibold text-foreground">{it.name}</div>
            <div className="text-xs text-muted-foreground">{it.short}</div>
          </div>
        </Link>
      ))}
    </div>
  );

  const ddBtn = (key: DropdownKey, label: string) => (
    <div className="relative" data-nav-anchor onPointerEnter={(e) => { if (e.pointerType === "mouse") setOpenDropdown(key); }} onPointerLeave={(e) => { if (e.pointerType === "mouse") setOpenDropdown((k) => (k === key ? null : k)); }}>
      <button
        type="button"
        onClick={() => setOpenDropdown(openDropdown === key ? null : key)}
        aria-expanded={openDropdown === key}
        aria-haspopup="true"
        className={`nav-link font-body inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-1.5 text-sm font-medium transition-colors hover:text-foreground ${openDropdown === key || isActive(SECTION_PATHS[key]) ? "nav-link-active text-foreground" : "text-muted-foreground"}`}
      >
        {label} <span aria-hidden="true" className={`text-[10px] transition-transform duration-200 ${openDropdown === key ? "rotate-180" : ""}`}>▾</span>
      </button>
      {openDropdown === key && (
        <>
          {/* Invisible bridge so the menu doesn't close while the pointer moves down to it. */}
          <span aria-hidden="true" className="absolute left-0 right-0 top-full h-3" />
          {key === "services" && (
            <div ref={fitPanel} className="nav-pop absolute left-1/2 top-full z-50 mt-2 w-[340px] -translate-x-1/2 rounded-2xl border border-border bg-background p-2 shadow-xl">
              <Link to="/services" onClick={() => setOpenDropdown(null)} className="mb-1 flex items-center justify-between rounded-xl bg-muted px-3 py-2.5 text-sm font-semibold text-foreground">All services <span aria-hidden="true">→</span></Link>
              {SERVICES.map((s) => (
                <Link key={s.slug} to="/services/$slug" params={{ slug: s.slug }} onClick={() => setOpenDropdown(null)} className="flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-muted focus-visible:bg-muted">
                  <span className="text-lg">{s.icon}</span>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.short}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          {key === "expertise" && (
            <div ref={fitPanel} className="nav-pop absolute left-1/2 top-full z-50 mt-2 grid max-h-[70vh] w-[680px] max-w-[calc(100vw-24px)] -translate-x-1/2 grid-cols-2 gap-1 overflow-y-auto rounded-2xl border border-border bg-background p-2 shadow-xl">
              {EXPERTISE.map(e => (
                <Link key={e.slug} to="/expertise/$slug" params={{ slug: e.slug }} onClick={() => setOpenDropdown(null)} className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted focus-visible:bg-muted">
                  <span>{e.icon}</span><span className="text-xs font-medium text-foreground">{e.name}</span>
                </Link>
              ))}
            </div>
          )}
          {key === "solutions" && (
            <div ref={fitPanel} className="nav-pop absolute left-1/2 top-full z-50 mt-2 w-[720px] max-w-[calc(100vw-24px)] -translate-x-1/2 rounded-2xl border border-border bg-background p-3 shadow-xl">
              <div className="grid grid-cols-2 gap-1">
                {SOLUTION_CATEGORIES.map((c) => (
                  <Link key={c.slug} to="/solutions/$category" params={{ category: c.slug }} onClick={() => setOpenDropdown(null)} className="group/item flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-muted focus-visible:bg-muted">
                    <span className="text-xl transition-transform duration-200 group-hover/item:scale-110" aria-hidden="true">{c.icon}</span>
                    <div><div className="text-sm font-semibold text-foreground">{c.name}</div><div className="text-xs text-muted-foreground">{c.short}</div></div>
                  </Link>
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 rounded-xl bg-muted px-4 py-3">
                <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Try before you hire:</span> every solution has a live demo you can customise.</p>
                <div className="flex shrink-0 gap-2">
                  <Link to="/solutions" onClick={() => setOpenDropdown(null)} className="rounded-full bg-[var(--emma-violet)] px-3 py-1.5 text-xs font-semibold text-white">All solutions →</Link>
                  <Link to="/solutions/app-planner" onClick={() => setOpenDropdown(null)} className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground">App feature planner</Link>
                </div>
              </div>
            </div>
          )}
          {key === "resources" && dropdownPanel(RESOURCES)}
          {key === "tools" && dropdownPanel(TOOLS, 2, "w-[600px]")}
          {key === "company" && dropdownPanel(COMPANY, 2, "w-[560px]")}
          {key === "account" && <div className="nav-pop-r [&>div]:left-auto [&>div]:right-0 [&>div]:translate-x-0">{dropdownPanel(ACCOUNT)}</div>}
        </>
      )}
    </div>
  );

  const mobileSection_ = (key: DropdownKey, label: string, items: { to: string; name: string; icon: string }[]) => (
    <>
      <button onClick={() => setMobileSection(mobileSection === key ? null : key)} aria-expanded={mobileSection === key} className="flex items-center justify-between font-display text-lg font-bold text-foreground py-3 border-b border-border w-full">
        {label} <span className={`text-sm transition ${mobileSection === key ? "rotate-180" : ""}`}>▾</span>
      </button>
      {mobileSection === key && (
        <div className="border-b border-border pb-2">
          {items.map(it => (
            <Link key={it.to} to={it.to} onClick={() => setMobileOpen(false)} className="flex items-center gap-2 py-2.5 pl-3 text-sm text-muted-foreground hover:text-foreground">
              <span>{it.icon}</span> {it.name}
            </Link>
          ))}
        </div>
      )}
    </>
  );

  return (
    <>
    <header className={`site-header fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${hidden ? "-translate-y-full" : "translate-y-0"} ${mobileOpen ? "bg-background" : scrolled ? "glass is-scrolled shadow-sm" : onInkHero ? "nav-on-ink bg-transparent" : "bg-transparent"}`}>
      <a href="#main-content" onClick={(e) => { const m = document.querySelector("main"); if (!m) return; e.preventDefault(); m.setAttribute("tabindex", "-1"); m.focus(); m.scrollIntoView(); }} className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-[200] focus:rounded-full focus:bg-[var(--emma-violet)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white">Skip to content</a>
      <nav ref={navRef} aria-label="Main" className={`mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 transition-[padding] duration-300 sm:px-5 ${scrolled ? "py-2.5" : "py-4"}`}>
        <Link to="/" className="flex shrink-0 items-baseline gap-0.5" aria-label="EmmaForYou home">
          <span className="font-display text-[1.05rem] font-extrabold tracking-tight text-foreground sm:text-xl">EmmaForYou</span>
          <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: "var(--gradient-gold)" }} />
        </Link>

        <div className="hidden items-center gap-1.5 xl:flex">
          <Link to="/" aria-current={pathname === "/" ? "page" : undefined} className={`nav-link font-body rounded-full px-2.5 py-1.5 text-sm font-medium hover:text-foreground ${pathname === "/" ? "nav-link-active text-foreground" : "text-muted-foreground"}`}>{t("nav_home")}</Link>
          {ddBtn("services", "Services")}
          {ddBtn("solutions", "Solutions")}
          {ddBtn("expertise", "Expertise")}
          {ddBtn("company", "Company")}
          {ddBtn("resources", "Resources")}
          {ddBtn("tools", "Tools")}
          <Link to="/pricing" aria-current={pathname === "/pricing" ? "page" : undefined} className={`nav-link font-body rounded-full px-2.5 py-1.5 text-sm font-medium hover:text-foreground ${pathname === "/pricing" ? "nav-link-active text-foreground" : "text-muted-foreground"}`}>Pricing</Link>
          {ddBtn("account", "Login")}
          <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
          <DarkModeToggle />
          <LanguageSelector />
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="btn-gold nav-cta group ml-1 inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-5 py-2.5 text-sm">
            {t("cta_waitlist")} <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
          </a>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2 xl:hidden">
          <div className="hidden items-center gap-1 min-[400px]:flex sm:gap-2"><DarkModeToggle /><LanguageSelector /></div>
          <button ref={triggerRef} type="button" onClick={() => setMobileOpen(!mobileOpen)} className="relative z-50 flex h-10 w-10 shrink-0 flex-col items-center justify-center gap-1.5 rounded-full" aria-label={mobileOpen ? "Close menu" : "Open menu"} aria-expanded={mobileOpen} aria-controls="mobile-nav">
            <span className={`h-0.5 w-6 rounded-full bg-foreground transition-all duration-300 ${mobileOpen ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`h-0.5 w-6 rounded-full bg-foreground transition-all duration-300 ${mobileOpen ? "opacity-0" : ""}`} />
            <span className={`h-0.5 w-6 rounded-full bg-foreground transition-all duration-300 ${mobileOpen ? "-translate-y-2 -rotate-45" : ""}`} />
          </button>
        </div>

      </nav>
      {scrolled && !mobileOpen && <div aria-hidden="true" className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-[var(--emma-violet)] to-[#9b8cff] transition-[width] duration-150" style={{ width: `${progress * 100}%` }} />}
    </header>
        <div onClick={() => setMobileOpen(false)} className={`fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm transition-opacity duration-300 xl:hidden ${mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`} aria-hidden />

        <aside id="mobile-nav" ref={drawerRef} className={`fixed top-0 right-0 z-[95] h-[100dvh] w-[85vw] max-w-sm overflow-y-auto overscroll-contain bg-background border-l border-border shadow-2xl transition-transform duration-300 ease-out xl:hidden ${mobileOpen ? "translate-x-0" : "translate-x-full"}`} role="dialog" aria-modal="true" aria-label="Mobile navigation" aria-hidden={!mobileOpen} inert={!mobileOpen}>
          <div className="flex flex-col gap-1 px-6 pt-24 pb-10">
            <div className="mb-4 flex items-center justify-between gap-2 min-[400px]:hidden"><span className="whitespace-nowrap text-xs font-semibold uppercase tracking-widest text-muted-foreground">Display</span><div className="flex items-center gap-2"><DarkModeToggle /><LanguageSelector /></div></div>
            <div className="mb-5 grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
              <Link to="/book" onClick={() => setMobileOpen(false)} className="flex min-h-12 items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl bg-[var(--emma-violet)] px-2 py-2.5 text-center text-sm font-semibold text-white"><span aria-hidden="true">📅</span>Book a call</Link>
              <Link to="/proposal" onClick={() => setMobileOpen(false)} className="flex min-h-12 items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl border border-border px-2 py-2.5 text-center text-sm font-semibold text-foreground"><span aria-hidden="true">📝</span>Get a quote</Link>
            </div>
            <p className="mb-3 font-body text-xs font-semibold uppercase tracking-widest text-muted-foreground">Menu</p>
            <Link to="/" onClick={() => setMobileOpen(false)} className="font-display text-lg font-bold text-foreground py-3 border-b border-border">{t("nav_home")}</Link>
            <button onClick={() => setMobileSection(mobileSection === "services" ? null : "services")} className="flex items-center justify-between font-display text-lg font-bold text-foreground py-3 border-b border-border w-full">
              Services <span className={`text-sm transition ${mobileSection === "services" ? "rotate-180" : ""}`}>▾</span>
            </button>
            {mobileSection === "services" && (
              <div className="border-b border-border pb-2">
                <Link to="/services" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 py-2.5 pl-3 text-sm font-semibold text-foreground">All services →</Link>
                {SERVICES.map(s => (
                  <Link key={s.slug} to="/services/$slug" params={{ slug: s.slug }} onClick={() => setMobileOpen(false)} className="flex items-center gap-2 py-2.5 pl-3 text-sm text-muted-foreground hover:text-foreground">
                    <span>{s.icon}</span> {s.name}
                  </Link>
                ))}
              </div>
            )}
            {mobileSection_("solutions", "Solutions & demos", [{ to: "/solutions", name: "All solutions", icon: "✨" }, ...SOLUTION_CATEGORIES.map((c) => ({ to: `/solutions/${c.slug}`, name: c.name, icon: c.icon })), { to: "/solutions/app-planner", name: "App feature planner", icon: "🧮" }])}
            <button onClick={() => setMobileSection(mobileSection === "expertise" ? null : "expertise")} className="flex items-center justify-between font-display text-lg font-bold text-foreground py-3 border-b border-border w-full">
              Expertise <span className={`text-sm transition ${mobileSection === "expertise" ? "rotate-180" : ""}`}>▾</span>
            </button>
            {mobileSection === "expertise" && (
              <div className="border-b border-border pb-2">
                {EXPERTISE.map(e => (
                  <Link key={e.slug} to="/expertise/$slug" params={{ slug: e.slug }} onClick={() => setMobileOpen(false)} className="flex items-center gap-2 py-2 pl-3 text-sm text-muted-foreground hover:text-foreground">
                    <span>{e.icon}</span> {e.name}
                  </Link>
                ))}
              </div>
            )}
            {mobileSection_("company", "Company", COMPANY)}
            {mobileSection_("resources", "Resources", RESOURCES)}
            {mobileSection_("tools", "Tools", TOOLS)}
            <Link to="/pricing" onClick={() => setMobileOpen(false)} className="font-display text-lg font-bold text-foreground py-3 border-b border-border">Pricing</Link>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <Link to="/portal" onClick={() => setMobileOpen(false)} className="rounded-2xl border border-border p-3 text-sm font-semibold text-foreground">🔐 Client Portal<span className="mt-0.5 block text-xs font-normal text-muted-foreground">Projects & invoices</span></Link>
              <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="rounded-2xl border border-border p-3 text-sm font-semibold text-foreground">📊 Dashboard<span className="mt-0.5 block text-xs font-normal text-muted-foreground">Owner login</span></Link>
            </div>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" onClick={() => setMobileOpen(false)} className="btn-gold mt-8 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-base">
              {t("cta_waitlist")} <span aria-hidden>→</span>
            </a>
          </div>
        </aside>
    </>
  );
}
