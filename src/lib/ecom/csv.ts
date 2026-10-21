/**
 * CSV import for when a store can't be connected: an orders export (Shopify, WooCommerce, or any
 * CSV with an order number and a total). Runs in the browser; the file never leaves the device
 * unless the user saves the summary to their workspace.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let cell = ""; let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else quoted = false; } else cell += c; continue; }
    if (c === '"') quoted = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((v) => v.trim() !== ""));
}

const find = (headers: string[], ...names: RegExp[]) => { for (const re of names) { const i = headers.findIndex((h) => re.test(h)); if (i >= 0) return i; } return -1; };
const num = (s: string | undefined) => { if (!s) return 0; const v = Number(s.replace(/[^\d.-]/g, "")); return Number.isFinite(v) ? v : 0; };

export interface OrdersSummary {
  source: string; rows: number; orders: number; revenue: number; discounts: number; shipping: number; refunds: number; taxes: number;
  customers: number | null; repeatCustomers: number | null; from: string | null; to: string | null; currency: string | null; columns: Record<string, string | null>; warnings: string[];
}

export function summariseOrders(text: string): OrdersSummary {
  const rows = parseCsv(text);
  if (rows.length < 2) throw new Error("The file has no data rows.");
  const h = rows[0].map((x) => x.trim().toLowerCase());
  const col = {
    order: find(h, /^name$/, /^order( number| id|_id| #)?$/, /order number/, /^id$/),
    total: find(h, /^total$/, /order total/, /^total sales$/, /^amount$/, /grand total/),
    subtotal: find(h, /^subtotal$/, /order subtotal/),
    discount: find(h, /discount amount/, /^discount/, /cart discount/),
    shipping: find(h, /^shipping$/, /shipping (amount|total|cost)/, /order shipping/),
    refunds: find(h, /refunded amount/, /refund/),
    taxes: find(h, /^taxes$/, /^tax( total)?$/, /order tax/),
    email: find(h, /^email$/, /billing email/, /customer email/, /^customer$/),
    date: find(h, /created at/, /order date/, /^date$/, /paid at/),
    currency: find(h, /^currency$/, /order currency/),
  };
  if (col.order < 0 || col.total < 0) throw new Error("Couldn't find an order number and an order total column. Export orders from your store as CSV and try again.");
  const seen = new Map<string, string[]>();
  for (const r of rows.slice(1)) { const id = (r[col.order] ?? "").trim(); if (!id) continue; if (!seen.has(id) || (!(seen.get(id)![col.total] ?? "").trim() && (r[col.total] ?? "").trim())) seen.set(id, r); }
  const orders = [...seen.values()];
  const sum = (i: number) => (i < 0 ? 0 : orders.reduce((s, r) => s + num(r[i]), 0));
  const byEmail = new Map<string, number>();
  if (col.email >= 0) for (const r of orders) { const e = (r[col.email] ?? "").trim().toLowerCase(); if (e) byEmail.set(e, (byEmail.get(e) ?? 0) + 1); }
  const dates = col.date >= 0 ? orders.map((r) => Date.parse(r[col.date])).filter(Number.isFinite).sort((a, b) => a - b) : [];
  const taxes = sum(col.taxes);
  const totalCol = h[col.total];
  const warnings: string[] = [];
  if (col.taxes >= 0 && taxes > 0 && /^total/.test(totalCol)) warnings.push("Order totals include tax. Revenue below has tax removed so it isn't counted as income.");
  if (col.refunds < 0) warnings.push("No refunds column found: refunds are counted as 0.");
  if (col.email < 0) warnings.push("No customer email column: repeat-customer figures aren't available.");
  const names = Object.fromEntries(Object.entries(col).map(([k, i]) => [k, i >= 0 ? rows[0][i] : null]));
  return {
    source: h.includes("lineitem quantity") ? "Shopify orders export" : h.some((x) => /order total amount|order number/.test(x)) ? "WooCommerce orders export" : "Orders CSV",
    rows: rows.length - 1, orders: orders.length,
    revenue: sum(col.total) - (/^total/.test(totalCol) ? taxes : 0), discounts: sum(col.discount), shipping: sum(col.shipping), refunds: sum(col.refunds), taxes,
    customers: col.email >= 0 ? byEmail.size : null, repeatCustomers: col.email >= 0 ? [...byEmail.values()].filter((n) => n > 1).length : null,
    from: dates.length ? new Date(dates[0]).toISOString().slice(0, 10) : null, to: dates.length ? new Date(dates[dates.length - 1]).toISOString().slice(0, 10) : null,
    currency: col.currency >= 0 ? (orders.find((r) => r[col.currency])?.[col.currency] ?? null) : null,
    columns: names, warnings,
  };
}
