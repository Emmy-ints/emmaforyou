import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";

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
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "EmmaForYou | AI Automation & Digital Growth Agency" },
      { name: "description", content: "EmmaForYou helps 50+ business types grow with AI automation, website design, social media management and more." },
      { name: "author", content: "EmmaForYou" },
      { property: "og:title", content: "EmmaForYou | AI Automation & Digital Growth Agency" },
      { name: "twitter:title", content: "EmmaForYou | AI Automation & Digital Growth Agency" },
      { property: "og:description", content: "EmmaForYou helps 50+ business types grow with AI automation, website design, social media management and more." },
      { name: "twitter:description", content: "EmmaForYou helps 50+ business types grow with AI automation, website design, social media management and more." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/gVBUQ568wCezkaRHakh9kKy9yXn1/social-images/social-1776299046090-11af4dcf-31fc-4b22-ae72-beea4dc6f015.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/gVBUQ568wCezkaRHakh9kKy9yXn1/social-images/social-1776299046090-11af4dcf-31fc-4b22-ae72-beea4dc6f015.webp" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap" },
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
  return <Outlet />;
}
