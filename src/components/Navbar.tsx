import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import LanguageSelector from "./LanguageSelector";
import DarkModeToggle from "./DarkModeToggle";
import { useI18n } from "@/lib/i18n";
import { SERVICES, EXPERTISE } from "@/lib/services-data";

const WHATSAPP_URL = "https://wa.me/message/HHGMMWMRJFYUC1";

type DropdownKey = "services" | "expertise" | "resources" | "tools" | "company";

const RESOURCES = [
  { to: "/blog", name: "Blog", icon: "📝", short: "Growth insights & guides" },
  { to: "/knowledge-base", name: "Knowledge Base", icon: "📚", short: "Deep playbooks" },
  { to: "/free-resources", name: "Free Resources", icon: "🎁", short: "Templates & lead magnets" },
  { to: "/faq", name: "FAQ", icon: "❓", short: "Common questions" },
];

const TOOLS = [
  { to: "/roi-calculator", name: "ROI Calculator", icon: "🧮", short: "Estimate your return" },
  { to: "/growth-quiz", name: "Growth Quiz", icon: "🎯", short: "Find your next step" },
  { to: "/email-generator", name: "Email Generator", icon: "✉️", short: "AI-written emails" },
  { to: "/analyser", name: "Site Analyser", icon: "🔬", short: "Audit your funnel" },
];

const COMPANY = [
  { to: "/about", name: "About Us", icon: "👋", short: "Our story & mission" },
  { to: "/portfolio", name: "Portfolio", icon: "💼", short: "Featured client work" },
  { to: "/cases", name: "Case Studies", icon: "📈", short: "Real results" },
  { to: "/testimonials", name: "Testimonials", icon: "⭐", short: "What clients say" },
  { to: "/affiliate", name: "Affiliate Program", icon: "🤝", short: "Earn with us" },
  { to: "/intake", name: "Get Started", icon: "🚀", short: "Project intake" },
];

export default function Navbar() {
  const { t } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<null | DropdownKey>(null);
  const [mobileSection, setMobileSection] = useState<DropdownKey | null>(null);
  const [lastY, setLastY] = useState(0);
  const location = useLocation();
  const drawerRef = useRef<HTMLElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const handleScroll = useCallback(() => {
    const y = window.scrollY;
    setScrolled(y > 20);
    setHidden(y > lastY && y > 100);
    setLastY(y);
  }, [lastY]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    setMobileOpen(false);
    setMobileSection(null);
  }, [location.pathname]);

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

  const dropdownPanel = (items: { to: string; name: string; icon: string; short: string }[], cols: 1 | 2 = 1, width = "w-[340px]") => (
    <div className={`absolute left-1/2 top-full z-50 mt-2 ${width} -translate-x-1/2 rounded-2xl border border-border bg-background p-2 shadow-xl grid gap-1`} style={{ gridTemplateColumns: cols === 2 ? "1fr 1fr" : "1fr" }}>
      {items.map((it) => (
        <Link key={it.to} to={it.to} className="flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-muted">
          <span className="text-lg">{it.icon}</span>
          <div>
            <div className="text-sm font-semibold text-foreground">{it.name}</div>
            <div className="text-xs text-muted-foreground">{it.short}</div>
          </div>
        </Link>
      ))}
    </div>
  );

  const ddBtn = (key: DropdownKey, label: string) => (
    <div className="relative" onMouseEnter={() => setOpenDropdown(key)} onMouseLeave={() => setOpenDropdown(null)}>
      <button className="font-body text-sm font-medium text-muted-foreground transition-colors hover:text-foreground inline-flex items-center gap-1">
        {label} <span className="text-xs">▾</span>
      </button>
      {openDropdown === key && (
        <>
          {key === "services" && (
            <div className="absolute left-1/2 top-full z-50 mt-2 w-[340px] -translate-x-1/2 rounded-2xl border border-border bg-background p-2 shadow-xl">
              {SERVICES.map((s) => (
                <Link key={s.slug} to="/services/$slug" params={{ slug: s.slug }} className="flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-muted">
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
            <div className="absolute left-1/2 top-full z-50 mt-2 grid w-[680px] -translate-x-1/2 grid-cols-2 gap-1 rounded-2xl border border-border bg-background p-2 shadow-xl">
              {EXPERTISE.map(e => (
                <Link key={e.slug} to="/expertise/$slug" params={{ slug: e.slug }} className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted">
                  <span>{e.icon}</span><span className="text-xs font-medium text-foreground">{e.name}</span>
                </Link>
              ))}
            </div>
          )}
          {key === "resources" && dropdownPanel(RESOURCES)}
          {key === "tools" && dropdownPanel(TOOLS)}
          {key === "company" && dropdownPanel(COMPANY)}
        </>
      )}
    </div>
  );

  const mobileSection_ = (key: DropdownKey, label: string, items: { to: string; name: string; icon: string }[]) => (
    <>
      <button onClick={() => setMobileSection(mobileSection === key ? null : key)} className="flex items-center justify-between font-display text-lg font-bold text-foreground py-3 border-b border-border w-full">
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
    <header className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${hidden ? "-translate-y-full" : "translate-y-0"} ${scrolled ? "glass shadow-sm" : "bg-transparent"}`}>
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <Link to="/" className="flex items-baseline gap-0.5">
          <span className="font-display text-xl font-extrabold tracking-tight text-foreground">EmmaForYou</span>
          <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: "var(--gradient-gold)" }} />
        </Link>

        <div className="hidden items-center gap-5 xl:flex">
          <Link to="/" className="font-body text-sm font-medium text-muted-foreground hover:text-foreground">{t("nav_home")}</Link>
          {ddBtn("services", "Services")}
          {ddBtn("expertise", "Expertise")}
          {ddBtn("company", "Company")}
          {ddBtn("resources", "Resources")}
          {ddBtn("tools", "Tools")}
          <Link to="/pricing" className="font-body text-sm font-medium text-muted-foreground hover:text-foreground">Pricing</Link>
          <DarkModeToggle />
          <LanguageSelector />
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="btn-gold inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm">
            {t("cta_waitlist")} <span aria-hidden>→</span>
          </a>
        </div>

        <div className="flex items-center gap-2 xl:hidden">
          <DarkModeToggle />
          <LanguageSelector />
          <button ref={triggerRef} onClick={() => setMobileOpen(!mobileOpen)} className="relative z-50 flex h-10 w-10 flex-col items-center justify-center gap-1.5" aria-label="Toggle menu" aria-expanded={mobileOpen}>
            <span className={`h-0.5 w-6 rounded-full bg-foreground transition-all duration-300 ${mobileOpen ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`h-0.5 w-6 rounded-full bg-foreground transition-all duration-300 ${mobileOpen ? "opacity-0" : ""}`} />
            <span className={`h-0.5 w-6 rounded-full bg-foreground transition-all duration-300 ${mobileOpen ? "-translate-y-2 -rotate-45" : ""}`} />
          </button>
        </div>

        <div onClick={() => setMobileOpen(false)} className={`fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity duration-300 xl:hidden ${mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`} aria-hidden />

        <aside ref={drawerRef} className={`fixed top-0 right-0 z-40 h-screen w-[85vw] max-w-sm overflow-y-auto bg-background border-l border-border shadow-2xl transition-transform duration-300 ease-out xl:hidden ${mobileOpen ? "translate-x-0" : "translate-x-full"}`} role="dialog" aria-modal="true" aria-label="Mobile navigation" aria-hidden={!mobileOpen}>
          <div className="flex flex-col gap-1 px-6 pt-24 pb-10">
            <p className="mb-3 font-body text-xs font-semibold uppercase tracking-widest text-muted-foreground">Menu</p>
            <Link to="/" onClick={() => setMobileOpen(false)} className="font-display text-lg font-bold text-foreground py-3 border-b border-border">{t("nav_home")}</Link>
            <button onClick={() => setMobileSection(mobileSection === "services" ? null : "services")} className="flex items-center justify-between font-display text-lg font-bold text-foreground py-3 border-b border-border w-full">
              Services <span className={`text-sm transition ${mobileSection === "services" ? "rotate-180" : ""}`}>▾</span>
            </button>
            {mobileSection === "services" && (
              <div className="border-b border-border pb-2">
                {SERVICES.map(s => (
                  <Link key={s.slug} to="/services/$slug" params={{ slug: s.slug }} onClick={() => setMobileOpen(false)} className="flex items-center gap-2 py-2.5 pl-3 text-sm text-muted-foreground hover:text-foreground">
                    <span>{s.icon}</span> {s.name}
                  </Link>
                ))}
              </div>
            )}
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
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" onClick={() => setMobileOpen(false)} className="btn-gold mt-8 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-base">
              {t("cta_waitlist")} <span aria-hidden>→</span>
            </a>
          </div>
        </aside>
      </nav>
    </header>
  );
}
