import { Outlet, Link, createRootRoute, HeadContent, Scripts, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { I18nProvider } from "../lib/i18n";
import { installClickTracking, track } from "../lib/analytics";
import { ORG_DESCRIPTION, VERIFICATION_META, founderLd, organizationLd, websiteLd } from "../lib/seo";




import appCss from "../styles.css?url";
import PageTranslator from "../components/tools/PageTranslator";
import VoiceAsk from "../components/tools/VoiceAsk";
import ConversionLayer from "../components/tools/ConversionLayer";
import MotionRuntime from "../components/future/MotionRuntime";
import SearchLauncher from "../components/future/SearchLauncher";
import ScrollTop from "../components/future/ScrollTop";
import DesignTokens from "../components/future/DesignTokens";
import NotFoundComponent from "../components/future/NotFound";

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
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const docLang = /^\/fr(\/|$)/.test(pathname) ? "fr" : /^\/de(\/|$)/.test(pathname) ? "de" : "en";
  return (
    <html lang={docLang}>
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
      <MotionRuntime />
      <DesignTokens />
      <Outlet />
      <PageTranslator />
      <VoiceAsk />
      <ConversionLayer />
      <SearchLauncher />
      <ScrollTop />
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
