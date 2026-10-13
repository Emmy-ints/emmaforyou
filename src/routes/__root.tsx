import { Outlet, Link, createRootRoute, HeadContent, Scripts, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { I18nProvider } from "../lib/i18n";
import { installClickTracking, track } from "../lib/analytics";
import { ORG_DESCRIPTION, VERIFICATION_META, founderLd, organizationLd, websiteLd } from "../lib/seo";




import appCss from "../styles.css?url";
import PageTranslator from "../components/tools/PageTranslator";
import VoiceAsk from "../components/tools/VoiceAsk";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 font-display text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="btn-primary-gradient inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "EmmaForYou — AI Automation, Websites & Digital Growth Agency" },
      { name: "description", content: ORG_DESCRIPTION },
      { name: "author", content: "EmmaForYou" },
      { name: "theme-color", content: "#0b0d24" },
      { name: "format-detection", content: "telephone=no" },
      ...VERIFICATION_META,
    ],
    scripts: [organizationLd(), websiteLd(), founderLd()].map((x) => ({ type: "application/ld+json", children: JSON.stringify(x) })),
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" },
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "apple-touch-icon", href: "/icons/icon-512.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <I18nProvider>
      <AnalyticsTracker />
      <Outlet />
      <PageTranslator />
      <VoiceAsk />
    </I18nProvider>
  );
}

/** Records a page view on every route change and counts WhatsApp/phone/email clicks site-wide. */
function AnalyticsTracker() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  useEffect(() => installClickTracking(), []);
  useEffect(() => {
    track("page_view");
  }, [pathname]);
  return null;
}
