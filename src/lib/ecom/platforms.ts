/**
 * Platform adapters. Each adapter says how to recognise a platform from its public pages and what
 * EmmaForYou can actually do with it today. "connected" lists the official API a store owner could
 * authorise in future; none are live yet (they need an approved app and credentials), so the
 * integrations page shows them as unavailable rather than pretending to connect.
 */
export interface Capability { publicAudit: boolean; productPages: boolean; productSchema: "usual" | "sometimes" | "rare"; connected: { api: string; data: string[]; status: "unavailable"; requires: string } | null; notes?: string }
export interface Adapter { id: string; name: string; kind: "store" | "marketplace" | "social" | "custom"; detect: { host?: RegExp; html?: RegExp[]; headers?: RegExp[] }; productPath?: RegExp; caps: Capability }

const store = (api: string, requires: string): Capability["connected"] => ({ api, data: ["orders", "revenue", "products", "refunds", "customers"], status: "unavailable", requires });

export const ADAPTERS: Adapter[] = [
  { id: "shopify", name: "Shopify", kind: "store", detect: { html: [/cdn\.shopify\.com/i, /Shopify\.theme/i, /shopify-section/i], headers: [/x-shopify/i, /powered-by:\s*shopify/i] }, productPath: /\/products\/[^/?#]+/i,
    caps: { publicAudit: true, productPages: true, productSchema: "usual", connected: store("Shopify Admin API (OAuth app)", "A Shopify Partner app (API key + secret) approved for read_orders, read_products, read_reports.") } },
  { id: "woocommerce", name: "WooCommerce", kind: "store", detect: { html: [/woocommerce/i, /wp-content\/plugins\/woocommerce/i, /wc-block/i] }, productPath: /\/product\/[^/?#]+/i,
    caps: { publicAudit: true, productPages: true, productSchema: "usual", connected: store("WooCommerce REST API", "A read-only REST API key created by the store owner, entered through a secure server-side form (not yet built).") } },
  { id: "wix", name: "Wix", kind: "store", detect: { html: [/static\.wixstatic\.com/i, /wix-code|wixsite|_wixCssImports/i], headers: [/x-wix-/i] }, productPath: /\/product-page\/[^/?#]+/i,
    caps: { publicAudit: true, productPages: true, productSchema: "sometimes", connected: store("Wix eCommerce API (OAuth app)", "A Wix app registered in the Wix Developers Center.") } },
  { id: "bigcommerce", name: "BigCommerce", kind: "store", detect: { html: [/cdn\d*\.bigcommerce\.com/i, /bigcommerce/i] }, productPath: /\/[^/?#]+\/?$/,
    caps: { publicAudit: true, productPages: true, productSchema: "usual", connected: store("BigCommerce REST API", "A BigCommerce app or store API account with read scopes.") } },
  { id: "squarespace", name: "Squarespace", kind: "store", detect: { html: [/static1\.squarespace\.com/i, /squarespace/i] }, productPath: /\/shop\/p\/[^/?#]+|\/store\/p\//i,
    caps: { publicAudit: true, productPages: true, productSchema: "sometimes", connected: store("Squarespace Commerce API", "A Squarespace API key from the site owner (Commerce Advanced plan).") } },
  { id: "magento", name: "Adobe Commerce / Magento", kind: "store", detect: { html: [/Magento_/i, /mage\/cookies/i, /static\/version\d+/i] }, productPath: /\.html$/i,
    caps: { publicAudit: true, productPages: true, productSchema: "usual", connected: store("Adobe Commerce REST API", "An integration token created in the store admin.") } },
  { id: "prestashop", name: "PrestaShop", kind: "store", detect: { html: [/prestashop/i, /\/modules\/ps_/i] }, productPath: /\/\d+-[^/?#]+\.html$/i,
    caps: { publicAudit: true, productPages: true, productSchema: "sometimes", connected: store("PrestaShop Webservice API", "A webservice key with read permissions.") } },
  { id: "opencart", name: "OpenCart", kind: "store", detect: { html: [/route=product\/product/i, /catalog\/view\/theme/i] }, productPath: /route=product\/product|product_id=/i,
    caps: { publicAudit: true, productPages: true, productSchema: "rare", connected: store("OpenCart API", "An API user configured in the store admin.") } },
  { id: "shopware", name: "Shopware", kind: "store", detect: { html: [/shopware/i, /sw-/] }, caps: { publicAudit: true, productPages: true, productSchema: "usual", connected: store("Shopware Admin API", "An integration (access key) created in Shopware.") } },
  { id: "ecwid", name: "Ecwid", kind: "store", detect: { html: [/app\.ecwid\.com|ecwid/i] }, caps: { publicAudit: true, productPages: false, productSchema: "rare", connected: store("Ecwid REST API", "An Ecwid app with read_catalog and read_orders scopes."), notes: "Ecwid stores render products in the browser, so a public scan sees little product detail." } },
  { id: "sfcc", name: "Salesforce Commerce Cloud", kind: "store", detect: { html: [/demandware/i, /dwanonymous|dw\/shop/i] }, caps: { publicAudit: true, productPages: true, productSchema: "sometimes", connected: store("B2C Commerce API", "An API client from the merchant's Account Manager.") } },
  { id: "commercetools", name: "commercetools (headless)", kind: "custom", detect: { html: [/commercetools/i] }, caps: { publicAudit: true, productPages: true, productSchema: "sometimes", connected: store("commercetools HTTP API", "An API client with view scopes.") } },
  { id: "amazon", name: "Amazon listing", kind: "marketplace", detect: { host: /(^|\.)amazon\.[a-z.]+$/i }, productPath: /\/dp\/[A-Z0-9]{10}/i, caps: { publicAudit: true, productPages: true, productSchema: "rare", connected: { api: "Amazon Selling Partner API", data: ["orders", "sales", "fees", "inventory"], status: "unavailable", requires: "A registered SP-API developer app and the seller's authorisation." }, notes: "Amazon often blocks automated page requests; when it does, the audit says so and asks you to paste the listing details instead." } },
  { id: "etsy", name: "Etsy listing", kind: "marketplace", detect: { host: /(^|\.)etsy\.com$/i }, productPath: /\/listing\/\d+/i, caps: { publicAudit: true, productPages: true, productSchema: "usual", connected: { api: "Etsy Open API v3", data: ["receipts", "listings", "shop stats"], status: "unavailable", requires: "An Etsy developer app (key string) and the shop owner's OAuth consent." } } },
  { id: "ebay", name: "eBay listing", kind: "marketplace", detect: { host: /(^|\.)ebay\.[a-z.]+$/i }, productPath: /\/itm\/\d+/i, caps: { publicAudit: true, productPages: true, productSchema: "sometimes", connected: { api: "eBay Sell APIs", data: ["orders", "listings", "traffic report"], status: "unavailable", requires: "An eBay developer keyset and the seller's OAuth consent." } } },
  { id: "walmart", name: "Walmart Marketplace", kind: "marketplace", detect: { host: /(^|\.)walmart\.com$/i }, productPath: /\/ip\//i, caps: { publicAudit: true, productPages: true, productSchema: "sometimes", connected: { api: "Walmart Marketplace API", data: ["orders", "items"], status: "unavailable", requires: "Seller API credentials from Walmart Seller Center." } } },
  { id: "jumia", name: "Jumia listing", kind: "marketplace", detect: { host: /(^|\.)jumia\.[a-z.]+$/i }, caps: { publicAudit: true, productPages: true, productSchema: "sometimes", connected: { api: "Jumia Seller Center API", data: ["orders", "products"], status: "unavailable", requires: "Seller Center API credentials." } } },
  { id: "tiktok", name: "TikTok Shop", kind: "social", detect: { host: /(^|\.)tiktok\.com$/i }, caps: { publicAudit: false, productPages: false, productSchema: "rare", connected: { api: "TikTok Shop Partner API", data: ["orders", "products"], status: "unavailable", requires: "An approved TikTok Shop partner app." }, notes: "TikTok pages load in the browser and block automated requests, so they can't be scanned publicly." } },
  { id: "instagram", name: "Instagram / Facebook shop", kind: "social", detect: { host: /(^|\.)(instagram|facebook)\.com$/i }, caps: { publicAudit: false, productPages: false, productSchema: "rare", connected: { api: "Meta Commerce / Graph API", data: ["catalog", "orders"], status: "unavailable", requires: "A Meta app with commerce permissions approved in App Review." }, notes: "Meta pages require sign-in, so they can't be scanned publicly." } },
];

export const CUSTOM: Adapter = { id: "custom", name: "Custom or unrecognised platform", kind: "custom", detect: {}, caps: { publicAudit: true, productPages: true, productSchema: "sometimes", connected: null } };

export function adapterById(id: string): Adapter { return ADAPTERS.find((a) => a.id === id) ?? CUSTOM; }

export function detectPlatform(url: URL, html: string, headers: Headers | Record<string, string>): { adapter: Adapter; signals: string[] } {
  const headerText = headers instanceof Headers ? [...headers.entries()].map(([k, v]) => `${k}: ${v}`).join("\n") : Object.entries(headers).map(([k, v]) => `${k}: ${v}`).join("\n");
  for (const a of ADAPTERS) {
    const signals: string[] = [];
    if (a.detect.host?.test(url.hostname)) signals.push(`address ${url.hostname}`);
    for (const re of a.detect.html ?? []) if (re.test(html)) signals.push(`page code mentions ${re.source.replace(/\\/g, "").slice(0, 40)}`);
    for (const re of a.detect.headers ?? []) if (re.test(headerText)) signals.push("server headers");
    if (signals.length >= (a.detect.host ? 1 : a.id === "shopware" ? 2 : 1)) return { adapter: a, signals };
  }
  return { adapter: CUSTOM, signals: [] };
}
