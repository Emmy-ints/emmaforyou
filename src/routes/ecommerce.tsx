import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

/** Ecommerce Intelligence: shared layout (site header, tool navigation, footer) for every /ecommerce page. */
export const Route = createFileRoute("/ecommerce")({ component: EcomLayout });

export const ECOM_NAV: { to: string; label: string; group: "start" | "grow" | "both" }[] = [
  { to: "/ecommerce", label: "Overview", group: "both" },
  { to: "/ecommerce/start", label: "Launch guide", group: "start" },
  { to: "/ecommerce/research", label: "Product research", group: "both" },
  { to: "/ecommerce/grow", label: "Store audit", group: "grow" },
  { to: "/ecommerce/diagnose", label: "Sales diagnosis", group: "grow" },
  { to: "/ecommerce/profit", label: "Profit analyzer", group: "both" },
  { to: "/ecommerce/competitors", label: "Competitors", group: "both" },
  { to: "/ecommerce/marketing", label: "Marketing", group: "both" },
  { to: "/ecommerce/plan", label: "Action plan", group: "both" },
  { to: "/ecommerce/guide", label: "Business guide", group: "both" },
  { to: "/ecommerce/workspace", label: "Workspace", group: "both" },
  { to: "/ecommerce/integrations", label: "Integrations", group: "grow" },
];

function EcomLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname }).replace(/\/$/, "") || "/";
  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen bg-background pb-20 pt-[68px] lg:pt-[72px]">
        <div className="sticky top-[68px] z-30 border-b border-border bg-background/90 backdrop-blur-md lg:top-[72px]">
          <nav aria-label="Ecommerce Intelligence" className="mx-auto max-w-7xl px-3 sm:px-5">
            <ul className="flex gap-1 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {ECOM_NAV.map((n) => {
                const active = n.to === "/ecommerce" ? pathname === "/ecommerce" : pathname.startsWith(n.to);
                return (
                  <li key={n.to} className="shrink-0">
                    <Link to={n.to} aria-current={active ? "page" : undefined} className={`inline-flex min-h-9 items-center rounded-full px-3.5 text-sm font-medium transition-colors ${active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>{n.label}</Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
        <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-5 lg:px-8"><Outlet /></div>
      </main>
      <Footer />
    </>
  );
}
