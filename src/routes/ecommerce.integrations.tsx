import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Check, Minus, Upload, Clock } from "lucide-react";
import { pageHead } from "@/lib/seo";
import { ADAPTERS, CUSTOM, type Adapter } from "@/lib/ecom/platforms";
import { Card, PageIntro } from "@/components/ecom/ui";

export const Route = createFileRoute("/ecommerce/integrations")({
  head: () => pageHead({ title: "Ecommerce Integrations — Platforms & Analytics Supported | EmmaForYou", description: "Which store platforms, marketplaces and analytics tools EmmaForYou supports today, what each connection would need, and how to import a CSV instead.", path: "/ecommerce/integrations" }),
  component: Integrations,
});

/** Analytics and ad platforms: none are connected yet. Each line states exactly what a real connection needs. */
const ANALYTICS: { name: string; data: string; requires: string; workaround: string }[] = [
  { name: "Google Analytics 4", data: "Sessions, product views, add-to-carts, checkouts, purchases", requires: "A Google Cloud OAuth client approved for the Analytics Data API (analytics.readonly), and the property owner's consent.", workaround: "Copy the funnel numbers from GA4 → Reports → Monetisation into the sales diagnosis." },
  { name: "Google Search Console", data: "Search clicks, impressions, queries per page", requires: "A Google OAuth client with the webmasters.readonly scope and the site owner's consent.", workaround: "Export Performance → Pages as CSV and review it alongside the store audit's SEO findings." },
  { name: "Google Ads", data: "Spend, conversions, cost per conversion", requires: "A Google Ads developer token (approved by Google) and an OAuth client.", workaround: "Enter ad spend and attributed revenue in the profit analyzer." },
  { name: "Meta Ads (Facebook & Instagram)", data: "Spend, purchases, ROAS", requires: "A Meta app with ads_read approved in App Review, and the ad account owner's consent.", workaround: "Enter spend and attributed revenue in the profit analyzer." },
  { name: "TikTok Ads", data: "Spend, conversions", requires: "An approved TikTok for Business developer app.", workaround: "Enter spend and attributed revenue in the profit analyzer." },
  { name: "PageSpeed Insights", data: "Real-user and lab speed scores in the store audit", requires: "Works without a key at low volume; a server-side PAGESPEED_API_KEY raises the limit.", workaround: "Used automatically when Google's service responds." },
];

const KIND_LABEL: Record<Adapter["kind"], string> = { store: "Store platforms", marketplace: "Marketplaces", social: "Social commerce", custom: "Headless & custom" };

function Integrations() {
  const groups = (["store", "marketplace", "social", "custom"] as const).map((k) => ({ k, rows: [...ADAPTERS.filter((a) => a.kind === k), ...(k === "custom" ? [CUSTOM] : [])] }));
  return (
    <div>
      <PageIntro eyebrow="Integrations" title="What we can connect to">Honest status for every platform. <strong>Public scan</strong> works today for any store address. <strong>Connected data</strong> (orders, traffic, ad spend pulled automatically) isn't live for any platform yet; each row says exactly what's needed. We will never ask for your store password.</PageIntro>

      <Card className="mb-4">
        <div className="flex flex-wrap items-start gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--emma-violet)]/10 text-[var(--emma-violet)]"><Upload className="h-4 w-4" aria-hidden="true" /></span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-base font-bold">Available now: CSV import and manual entry</h2>
            <p className="mt-1 text-sm text-muted-foreground">Export orders from Shopify (Orders → Export), WooCommerce (Analytics or Orders → Export) or any platform with an order number and total column, then upload it in the <Link to="/ecommerce/diagnose" className="font-semibold text-foreground underline">sales diagnosis</Link> or <Link to="/ecommerce/profit" className="font-semibold text-foreground underline">profit analyzer</Link>. Files are read in your browser; only the summary is saved if you choose to save it.</p>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {groups.map(({ k, rows }) => (
          <Card key={k} title={KIND_LABEL[k]}>
            <div className="-mx-4 overflow-x-auto px-4 sm:-mx-5 sm:px-5">
              <table className="w-full min-w-[640px] text-sm">
                <thead><tr className="text-left text-xs text-muted-foreground"><th scope="col" className="py-2 pr-3 font-semibold">Platform</th><th scope="col" className="py-2 pr-3 font-semibold">Public scan</th><th scope="col" className="py-2 pr-3 font-semibold">Product data</th><th scope="col" className="py-2 font-semibold">Connected data</th></tr></thead>
                <tbody>{rows.map((a) => (
                  <tr key={a.id} className="border-t border-border/60 align-top">
                    <th scope="row" className="py-2.5 pr-3 text-left font-semibold">{a.name}{a.caps.notes && <span className="mt-0.5 block text-xs font-normal text-muted-foreground">{a.caps.notes}</span>}</th>
                    <td className="py-2.5 pr-3">{a.caps.publicAudit ? <Yes>Available</Yes> : <No>Blocked by the platform</No>}</td>
                    <td className="py-2.5 pr-3 text-xs">{a.caps.productSchema === "usual" ? "Usually structured" : a.caps.productSchema === "sometimes" ? "Depends on theme" : "Rarely structured"}</td>
                    <td className="py-2.5 text-xs">{a.caps.connected ? (
                      <><span className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-300"><Clock className="h-3.5 w-3.5" aria-hidden="true" />Not available yet</span><span className="block text-muted-foreground">{a.caps.connected.api} · would read {a.caps.connected.data.join(", ")}</span><span className="block text-muted-foreground">Requires: {a.caps.connected.requires}</span></>
                    ) : <span className="text-muted-foreground">No standard API; use CSV import</span>}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </Card>
        ))}

        <Card title="Analytics & advertising">
          <ul className="divide-y divide-border">{ANALYTICS.map((x) => (
            <li key={x.name} className="py-3 text-sm">
              <div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{x.name}</span>{x.name === "PageSpeed Insights" ? <Yes>In use</Yes> : <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-300"><Clock className="h-3.5 w-3.5" aria-hidden="true" />Not available yet</span>}</div>
              <p className="mt-0.5 text-xs text-muted-foreground">Data: {x.data}</p>
              <p className="text-xs text-muted-foreground">Requires: {x.requires}</p>
              <p className="text-xs">Meanwhile: {x.workaround}</p>
            </li>
          ))}</ul>
        </Card>
        <p className="text-xs text-muted-foreground">Need a store connected now? Our team can set up reporting directly in your own accounts. <Link to="/services/$slug" params={{ slug: "ecommerce" }} className="underline">Ecommerce services</Link> · <Link to="/book" className="underline">Book a call</Link></p>
      </div>
    </div>
  );
}

function Yes({ children }: { children: ReactNode }) { return <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300"><Check className="h-3.5 w-3.5" aria-hidden="true" />{children}</span>; }
function No({ children }: { children: ReactNode }) { return <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Minus className="h-3.5 w-3.5" aria-hidden="true" />{children}</span>; }
