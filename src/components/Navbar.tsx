import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import LanguageSelector from "./LanguageSelector";
import DarkModeToggle from "./DarkModeToggle";
import { useI18n } from "@/lib/i18n";

const WHATSAPP_URL = "https://wa.me/message/HHGMMWMRJFYUC1";

export default function Navbar() {
  const { t } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lastY, setLastY] = useState(0);
  const location = useLocation();

  const NAV_LINKS = [
    { label: t("nav_home"), to: "/" },
    { label: "Portfolio", to: "/portfolio" },
    { label: "Pricing", to: "/pricing" },
    { label: "ROI", to: "/roi-calculator" },
    { label: "Resources", to: "/free-resources" },
    { label: "Quiz", to: "/growth-quiz" },
    { label: "Knowledge", to: "/knowledge-base" },
    { label: "Dashboard", to: "/dashboard" },
    { label: "Affiliate", to: "/affiliate" },
    { label: "Portal", to: "/portal" },
  ];

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
  }, [location.pathname]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
        hidden ? "-translate-y-full" : "translate-y-0"
      } ${scrolled ? "glass shadow-sm" : "bg-transparent"}`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <Link to="/" className="flex items-baseline gap-0.5">
          <span className="font-display text-xl font-extrabold tracking-tight text-foreground">
            EmmaForYou
          </span>
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: "var(--gradient-gold)" }}
          />
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-5 xl:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="font-body text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <DarkModeToggle />
          <LanguageSelector />
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm"
          >
            {t("cta_waitlist")} <span aria-hidden>→</span>
          </a>
        </div>

        {/* Mobile right cluster */}
        <div className="flex items-center gap-2 xl:hidden">
          <DarkModeToggle />
          <LanguageSelector />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="relative z-50 flex h-10 w-10 flex-col items-center justify-center gap-1.5"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            <span className={`h-0.5 w-6 rounded-full bg-foreground transition-all duration-300 ${mobileOpen ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`h-0.5 w-6 rounded-full bg-foreground transition-all duration-300 ${mobileOpen ? "opacity-0" : ""}`} />
            <span className={`h-0.5 w-6 rounded-full bg-foreground transition-all duration-300 ${mobileOpen ? "-translate-y-2 -rotate-45" : ""}`} />
          </button>
        </div>

        {/* Mobile backdrop */}
        <div
          onClick={() => setMobileOpen(false)}
          className={`fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity duration-300 xl:hidden ${
            mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
          aria-hidden
        />

        {/* Mobile slide-in drawer */}
        <aside
          className={`fixed top-0 right-0 z-40 h-screen w-[85vw] max-w-sm overflow-y-auto bg-background border-l border-border shadow-2xl transition-transform duration-300 ease-out xl:hidden ${
            mobileOpen ? "translate-x-0" : "translate-x-full"
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
        >
          <div className="flex flex-col gap-1 px-6 pt-24 pb-10">
            <p className="mb-3 font-body text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Menu
            </p>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="font-display text-lg font-bold text-foreground py-3 border-b border-border hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileOpen(false)}
              className="btn-gold mt-8 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-base"
            >
              {t("cta_waitlist")} <span aria-hidden>→</span>
            </a>
          </div>
        </aside>
      </nav>
    </header>
  );
}
