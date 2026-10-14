import { useMemo, useState } from "react";
import { Check, Minus, Plus, Search, Sparkles, Trash2 } from "lucide-react";
import { Badge, Btn, Field, Panel, Select, Toast, money, type EngineProps } from "./ui";

interface Prod { id: string; name: string; cat: string; price: number; emoji: string; hue: number; tags: string[]; vendor?: string; sizes?: string[]; available?: boolean; tiers?: [number, number][]; moq?: number }
interface Line { key: string; p: Prod; qty: number; size?: string; text?: string }

const mk = (id: string, name: string, cat: string, price: number, emoji: string, hue: number, tags: string[], extra: Partial<Prod> = {}): Prod => ({ id, name, cat, price, emoji, hue, tags, ...extra });

const P: Record<string, { cur: string; products: Prod[]; ship: number; label?: string }> = {
  fashion: { cur: "NGN", ship: 2500, products: [mk("f1", "Linen shirt", "Men", 18500, "👔", 210, ["white", "summer"], { sizes: ["S", "M", "L", "XL"] }), mk("f2", "Ankara midi dress", "Women", 32000, "👗", 20, ["print", "occasion"], { sizes: ["8", "10", "12", "14"] }), mk("f3", "Leather sandals", "Shoes", 22000, "🩴", 30, ["tan", "summer"], { sizes: ["40", "41", "42", "43"] }), mk("f4", "Silk scarf", "Accessories", 9500, "🧣", 330, ["gift", "print"]), mk("f5", "Tote bag", "Accessories", 7000, "👜", 45, ["gift", "everyday"]), mk("f6", "Agbada set", "Men", 65000, "🥻", 260, ["occasion"], { sizes: ["M", "L", "XL"] })] },
  marketplace: { cur: "USD", ship: 5, products: [mk("m1", "Handmade candle", "Home", 18, "🕯️", 40, ["gift"], { vendor: "Glow Crafts" }), mk("m2", "Shea butter 500g", "Beauty", 14, "🧴", 55, ["natural"], { vendor: "Kano Naturals" }), mk("m3", "Woven basket", "Home", 32, "🧺", 35, ["handmade"], { vendor: "Ashanti Weaves" }), mk("m4", "Coffee beans", "Food", 16, "☕", 25, ["organic"], { vendor: "Highland Roasters" }), mk("m5", "Beaded bracelet", "Jewellery", 22, "📿", 300, ["gift", "handmade"], { vendor: "Glow Crafts" }), mk("m6", "Hibiscus tea", "Food", 9, "🌺", 345, ["organic"], { vendor: "Kano Naturals" })] },
  wholesale: { cur: "USD", ship: 0, label: "Trade price", products: [mk("w1", "Bottled water (case of 24)", "Drinks", 6, "💧", 200, ["bulk"], { tiers: [[1, 6], [50, 5.4], [200, 4.9]], moq: 10 }), mk("w2", "Rice 25kg", "Grains", 28, "🌾", 45, ["bulk"], { tiers: [[1, 28], [20, 26], [100, 24.5]], moq: 5 }), mk("w3", "Cooking oil 5L", "Oils", 12, "🫒", 70, ["bulk"], { tiers: [[1, 12], [40, 11], [150, 10.2]], moq: 10 }), mk("w4", "Paper towels (12)", "Supplies", 9, "🧻", 0, ["bulk"], { tiers: [[1, 9], [30, 8.2]], moq: 6 })] },
  digital: { cur: "USD", ship: 0, products: [mk("d1", "Brand kit template", "Templates", 29, "🎨", 280, ["design"]), mk("d2", "Social media pack (60 posts)", "Templates", 19, "📱", 320, ["social"]), mk("d3", "Pricing calculator sheet", "Spreadsheets", 15, "📊", 150, ["finance"]), mk("d4", "Mini course: Sell on WhatsApp", "Courses", 49, "🎓", 210, ["course"]), mk("d5", "Notion business OS", "Templates", 39, "🗂️", 250, ["productivity"])] },
  courses: { cur: "USD", ship: 0, products: [mk("c1", "Facebook ads for beginners", "Marketing", 39, "📣", 220, ["4.7★"], { vendor: "Instructor: T. Bello" }), mk("c2", "Excel for small business", "Finance", 29, "📗", 140, ["4.8★"], { vendor: "Instructor: A. Shaw" }), mk("c3", "Product photography with a phone", "Creative", 25, "📸", 30, ["4.6★"], { vendor: "Instructor: K. Mensah" }), mk("c4", "Start a bakery business", "Business", 45, "🥐", 40, ["4.9★"], { vendor: "Instructor: F. Ade" })] },
  restaurant: { cur: "NGN", ship: 1500, label: "Menu", products: [mk("r1", "Party jollof (serves 2)", "Mains", 7500, "🍛", 15, ["spicy"], { available: true }), mk("r2", "Pepper soup", "Soups", 5500, "🍲", 5, ["spicy"], { available: true }), mk("r3", "Grilled fish", "Mains", 12000, "🐟", 200, ["grill"], { available: false }), mk("r4", "Small chops (10)", "Sides", 4000, "🥟", 35, ["party"], { available: true }), mk("r5", "Chapman", "Drinks", 2500, "🍹", 350, ["cold"], { available: true }), mk("r6", "Plantain (dodo)", "Sides", 1500, "🍌", 50, ["vegan"], { available: true })] },
  pod: { cur: "USD", ship: 6, products: [mk("p1", "Custom T-shirt", "Apparel", 24, "👕", 220, ["personalise"], { sizes: ["S", "M", "L", "XL"] }), mk("p2", "Custom mug", "Home", 16, "☕", 30, ["personalise"]), mk("p3", "Custom tote", "Bags", 20, "👜", 140, ["personalise"]), mk("p4", "Custom cap", "Apparel", 22, "🧢", 0, ["personalise"])] },
  pos: { cur: "NGN", ship: 0, label: "Till", products: [mk("s1", "Bread", "Bakery", 1200, "🍞", 40, ["123001"]), mk("s2", "Milk 1L", "Dairy", 1800, "🥛", 210, ["123002"]), mk("s3", "Eggs (crate)", "Dairy", 4500, "🥚", 45, ["123003"]), mk("s4", "Coca-Cola 50cl", "Drinks", 400, "🥤", 0, ["123004"]), mk("s5", "Rice 1kg", "Grains", 1600, "🍚", 50, ["123005"]), mk("s6", "Detergent", "Home", 2200, "🧼", 190, ["123006"])] },
  recommend: { cur: "USD", ship: 5, products: [mk("e1", "Running shoes", "Shoes", 89, "👟", 210, ["running"]), mk("e2", "Sports socks (3)", "Accessories", 12, "🧦", 0, ["running"]), mk("e3", "Water bottle", "Accessories", 18, "🍶", 190, ["running", "gym"]), mk("e4", "Gym bag", "Bags", 45, "🎒", 260, ["gym"]), mk("e5", "Yoga mat", "Fitness", 30, "🧘", 150, ["gym", "yoga"]), mk("e6", "Resistance bands", "Fitness", 20, "🏋️", 10, ["gym"])] },
  visual: { cur: "USD", ship: 5, products: [mk("v1", "Blue velvet sofa", "Sofas", 899, "🛋️", 220, ["blue", "velvet", "sofa"]), mk("v2", "Grey linen sofa", "Sofas", 749, "🛋️", 0, ["grey", "linen", "sofa"]), mk("v3", "Oak side table", "Tables", 159, "🪵", 35, ["wood", "table"]), mk("v4", "Blue armchair", "Chairs", 349, "💺", 215, ["blue", "chair"]), mk("v5", "Brass floor lamp", "Lighting", 129, "💡", 50, ["brass", "lamp"]), mk("v6", "Walnut coffee table", "Tables", 279, "🟫", 25, ["wood", "table"])] },
  app: { cur: "USD", ship: 3, products: [mk("a1", "Iced latte", "Coffee", 4.5, "🧋", 30, ["cold"]), mk("a2", "Croissant", "Bakery", 3, "🥐", 40, ["warm"]), mk("a3", "Matcha", "Tea", 5, "🍵", 120, ["cold"]), mk("a4", "Bagel", "Bakery", 3.5, "🥯", 35, ["warm"])] },
};
const VISUAL_SAMPLES: [string, string[]][] = [["📷 Photo: a blue sofa in a living room", ["blue", "sofa"]], ["📷 Photo: a wooden table", ["wood", "table"]], ["📷 Photo: a lamp in a reading nook", ["lamp", "brass"]]];
const TOGETHER: Record<string, string[]> = { e1: ["e2", "e3"], e4: ["e3", "e5"], e5: ["e6", "e3"], e2: ["e1"], e3: ["e1", "e4"], e6: ["e5", "e4"] };

export default function StoreDemo({ preset, brand }: EngineProps) {
  const cfg = P[preset] ?? P.fashion;
  const [products, setProducts] = useState(cfg.products);
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("Featured");
  const [cart, setCart] = useState<Line[]>([]);
  const [size, setSize] = useState<Record<string, string>>({});
  const [custom, setCustom] = useState<Record<string, string>>({});
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState(false);
  const [mode, setMode] = useState<"Delivery" | "Pickup">("Delivery");
  const [name, setName] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const [tendered, setTendered] = useState("");
  const [scan, setScan] = useState("");
  const [visual, setVisual] = useState<string[] | null>(null);
  const [admin, setAdmin] = useState(false);

  const unit = (p: Prod, qty: number) => (p.tiers ? [...p.tiers].reverse().find(([min]) => qty >= min)?.[1] ?? p.price : p.price);
  const cats = ["All", ...new Set(products.map((p) => p.cat))];
  const shown = useMemo(() => {
    let list = products.filter((p) => (cat === "All" || p.cat === cat) && `${p.name} ${p.tags.join(" ")} ${p.vendor ?? ""}`.toLowerCase().includes(q.toLowerCase()));
    if (visual) list = list.map((p) => ({ p, s: p.tags.filter((t) => visual.includes(t)).length })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).map((x) => x.p);
    if (sort === "Price: low") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "Price: high") list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [products, cat, q, sort, visual]);

  const add = (p: Prod, qty = 1) => {
    if (p.available === false) return;
    if (p.sizes && !size[p.id]) { setSize({ ...size, [p.id]: p.sizes[0] }); }
    const s = p.sizes ? size[p.id] ?? p.sizes[0] : undefined;
    const text = preset === "pod" ? custom[p.id] || brand : undefined;
    const key = `${p.id}|${s ?? ""}|${text ?? ""}`;
    const start = p.moq ?? qty;
    setCart((c) => (c.some((l) => l.key === key) ? c.map((l) => (l.key === key ? { ...l, qty: l.qty + qty } : l)) : [...c, { key, p, qty: Math.max(qty, start), size: s, text }]));
    setDone(null);
  };
  const subtotal = cart.reduce((s, l) => s + unit(l.p, l.qty) * l.qty, 0);
  const discount = applied ? subtotal * 0.1 : 0;
  const ship = cart.length && (mode === "Delivery" && cfg.ship) ? cfg.ship : 0;
  const total = subtotal - discount + ship;
  const commission = preset === "marketplace" || preset === "courses" ? subtotal * 0.15 : 0;
  const byVendor = cart.reduce<Record<string, number>>((m, l) => { const v = l.p.vendor ?? brand; m[v] = (m[v] ?? 0) + unit(l.p, l.qty) * l.qty; return m; }, {});
  const recs = preset === "recommend" ? [...new Set(cart.flatMap((l) => TOGETHER[l.p.id] ?? []))].filter((id) => !cart.some((l) => l.p.id === id)).map((id) => products.find((p) => p.id === id)!).filter(Boolean) : [];
  const checkout = () => { if (!cart.length || (preset !== "pos" && name.trim().length < 2)) return; setDone(`${preset === "pos" ? "Sale" : "Order"} ${preset === "pos" ? "#R" : "#"}${1000 + Math.floor(Math.random() * 9000)}`); };
  const change = Number(tendered) - total;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="space-y-3">
        <div className="flex flex-wrap items-end gap-2">
          {preset === "pos" ? (
            <form onSubmit={(e) => { e.preventDefault(); const p = products.find((x) => x.tags.includes(scan.trim())); if (p) add(p); setScan(""); }} className="flex flex-1 items-end gap-2">
              <Field label="Scan or type barcode (try 123003)" value={scan} onChange={(e) => setScan(e.target.value)} inputMode="numeric" className="flex-1" /><Btn type="submit">Add</Btn>
            </form>
          ) : (
            <label className="relative block min-w-[160px] flex-1 text-xs font-medium text-muted-foreground">Search<Search className="pointer-events-none absolute left-2.5 top-[30px] h-4 w-4" /><input value={q} onChange={(e) => setQ(e.target.value)} className="mt-1 block w-full rounded-lg border border-border bg-background py-1.5 pl-8 pr-2.5 text-sm outline-none focus:border-[var(--demo-accent)]" placeholder="Search products" /></label>
          )}
          <Select label="Category" value={cat} onChange={(e) => setCat(e.target.value)} options={cats} className="w-36" />
          {preset !== "pos" && <Select label="Sort" value={sort} onChange={(e) => setSort(e.target.value)} options={["Featured", "Price: low", "Price: high"]} className="w-32" />}
          {preset === "restaurant" && <Btn variant="ghost" onClick={() => setAdmin(!admin)}>{admin ? "Customer view" : "Kitchen: edit availability"}</Btn>}
        </div>
        {preset === "visual" && (
          <Panel title={<span className="flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-[var(--demo-accent)]" />Search with a photo</span>} actions={visual && <Btn variant="ghost" onClick={() => setVisual(null)}>Clear</Btn>}>
            <div className="flex flex-wrap gap-2">{VISUAL_SAMPLES.map(([l, tags]) => <button key={l} type="button" onClick={() => setVisual(tags)} className={`rounded-xl border px-3 py-2 text-left text-xs ${visual === tags ? "border-[var(--demo-accent)]" : "border-border"}`}>{l}</button>)}</div>
            <p className="mt-2 text-[11px] text-muted-foreground">Demo: sample photos are matched by their detected tags (colour, material, type). Production uses an image model on uploaded photos.</p>
          </Panel>
        )}
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {shown.map((p) => (
            <li key={p.id} className={`flex flex-col rounded-2xl border border-border bg-card p-2.5 ${p.available === false && !admin ? "opacity-50" : ""}`}>
              <div className="relative flex aspect-[4/3] items-center justify-center rounded-xl text-4xl" style={{ background: `linear-gradient(135deg, hsl(${p.hue} 70% 92%), hsl(${p.hue} 60% 80%))` }} aria-hidden="true">
                {p.emoji}{preset === "pod" && <span className="absolute bottom-2 max-w-[90%] truncate rounded bg-white/80 px-1.5 text-[10px] font-bold text-slate-800">{custom[p.id] || brand}</span>}
              </div>
              <p className="mt-2 text-sm font-semibold text-foreground">{p.name}</p>
              {p.vendor && <p className="text-[11px] text-muted-foreground">{p.vendor}</p>}
              <p className="text-sm text-foreground">{money(p.price, cfg.cur)}{p.tiers && <span className="block text-[10px] text-muted-foreground">{p.tiers.slice(1).map(([m, v]) => `${m}+: ${money(v, cfg.cur)}`).join(" · ")} · MOQ {p.moq}</span>}</p>
              {p.sizes && <select aria-label={`Size for ${p.name}`} value={size[p.id] ?? p.sizes[0]} onChange={(e) => setSize({ ...size, [p.id]: e.target.value })} className="mt-1 rounded-lg border border-border bg-background px-2 py-1 text-xs">{p.sizes.map((s) => <option key={s}>{s}</option>)}</select>}
              {preset === "pod" && <input aria-label={`Custom text for ${p.name}`} value={custom[p.id] ?? ""} onChange={(e) => setCustom({ ...custom, [p.id]: e.target.value.slice(0, 18) })} placeholder="Your text" className="mt-1 rounded-lg border border-border bg-background px-2 py-1 text-xs" />}
              {admin ? (
                <label className="mt-2 flex items-center gap-2 text-xs"><input type="checkbox" checked={p.available !== false} onChange={(e) => setProducts((ps) => ps.map((x) => (x.id === p.id ? { ...x, available: e.target.checked } : x)))} className="accent-[var(--demo-accent)]" />Available today</label>
              ) : (
                <Btn className="mt-auto !mt-2" disabled={p.available === false} onClick={() => add(p)}>{p.available === false ? "Sold out" : preset === "digital" || preset === "courses" ? "Buy" : "Add"}</Btn>
              )}
            </li>
          ))}
          {shown.length === 0 && <li className="col-span-full rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No products match.</li>}
        </ul>
      </div>

      <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
        <Panel title={`${preset === "pos" ? "Current sale" : "Cart"} (${cart.reduce((s, l) => s + l.qty, 0)})`}>
          {cart.length === 0 ? <p className="text-sm text-muted-foreground">Empty. Add something.</p> : (
            <ul className="space-y-2 text-sm">{cart.map((l) => (
              <li key={l.key} className="flex items-center gap-2">
                <span className="flex-1"><span className="font-medium">{l.p.name}</span>{(l.size || l.text) && <span className="block text-[11px] text-muted-foreground">{[l.size && `Size ${l.size}`, l.text && `"${l.text}"`].filter(Boolean).join(" · ")}</span>}<span className="block text-[11px] text-muted-foreground">{money(unit(l.p, l.qty), cfg.cur)} each</span></span>
                <button type="button" aria-label="Decrease" onClick={() => setCart((c) => c.map((x) => (x.key === l.key ? { ...x, qty: Math.max(l.p.moq ?? 1, x.qty - (l.p.moq ? 5 : 1)) } : x)))} className="rounded-full border border-border p-0.5"><Minus className="h-3 w-3" /></button>
                <span className="w-7 text-center">{l.qty}</span>
                <button type="button" aria-label="Increase" onClick={() => setCart((c) => c.map((x) => (x.key === l.key ? { ...x, qty: x.qty + (l.p.moq ? 5 : 1) } : x)))} className="rounded-full border border-border p-0.5"><Plus className="h-3 w-3" /></button>
                <button type="button" aria-label="Remove" onClick={() => setCart((c) => c.filter((x) => x.key !== l.key))} className="text-muted-foreground hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
              </li>))}</ul>
          )}
          {recs.length > 0 && <div className="mt-3 border-t border-border pt-2"><p className="text-xs font-semibold">Frequently bought together</p>{recs.map((p) => <button key={p.id} type="button" onClick={() => add(p)} className="mt-1 flex w-full items-center justify-between rounded-lg border border-border px-2 py-1 text-xs hover:border-[var(--demo-accent)]"><span>{p.emoji} {p.name}</span><span>+ {money(p.price, cfg.cur)}</span></button>)}</div>}
          {preset === "restaurant" && <div className="mt-3 flex rounded-full border border-border p-0.5 text-xs">{(["Delivery", "Pickup"] as const).map((m) => <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)} className={`flex-1 rounded-full py-1 ${mode === m ? "bg-[var(--demo-accent)] text-white" : ""}`}>{m}</button>)}</div>}
          {preset !== "pos" && preset !== "wholesale" && <form onSubmit={(e) => { e.preventDefault(); setApplied(code.trim().toUpperCase() === "WELCOME10"); }} className="mt-3 flex gap-1.5"><input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code (try WELCOME10)" aria-label="Discount code" className="flex-1 rounded-lg border border-border bg-background px-2 py-1 text-xs" /><Btn type="submit" variant="ghost" className="!px-2.5 !py-1 !text-xs">Apply</Btn></form>}
          <dl className="mt-3 space-y-1 border-t border-border pt-2 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{money(subtotal, cfg.cur)}</dd></div>
            {applied && <div className="flex justify-between text-emerald-600"><dt>WELCOME10</dt><dd>−{money(discount, cfg.cur)}</dd></div>}
            {ship > 0 && <div className="flex justify-between"><dt>{preset === "restaurant" ? "Delivery" : "Shipping"}</dt><dd>{money(ship, cfg.cur)}</dd></div>}
            <div className="flex justify-between font-semibold"><dt>Total</dt><dd>{money(total, cfg.cur)}</dd></div>
          </dl>
          {commission > 0 && <p className="mt-2 rounded-lg bg-muted p-2 text-[11px] text-muted-foreground">Marketplace view: platform commission 15% = {money(commission, cfg.cur)}. Payouts: {Object.entries(byVendor).map(([v, s]) => `${v.replace("Instructor: ", "")} ${money(s * 0.85, cfg.cur)}`).join(" · ")}</p>}
          {preset === "pos" ? (
            <div className="mt-3 space-y-2"><Field label="Cash tendered" type="number" min={0} value={tendered} onChange={(e) => setTendered(e.target.value)} />{tendered && <p className="text-sm">Change: <strong>{change >= 0 ? money(change, cfg.cur) : "Not enough"}</strong></p>}<Btn className="w-full" disabled={!cart.length || change < 0} onClick={checkout}>Complete sale</Btn></div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); checkout(); }} className="mt-3 space-y-2"><Field label="Name for the order" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} /><Btn type="submit" className="w-full" disabled={!cart.length || name.trim().length < 2}>{preset === "wholesale" ? "Place trade order" : "Checkout"}</Btn></form>
          )}
        </Panel>
        {done && (
          <div role="status" className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm">
            <p className="flex items-center gap-1.5 font-semibold"><Check className="h-4 w-4 text-emerald-600" />{done} confirmed</p>
            <p className="mt-1 text-xs text-muted-foreground">{preset === "digital" || preset === "courses" ? "Download links / course access would be emailed instantly (expiring, per-buyer links)." : preset === "pos" ? "Receipt printed, stock updated and synced to the online store." : preset === "pod" ? "Print file generated and routed to the nearest print partner." : "Confirmation sent by email and WhatsApp; stock reserved."}</p>
            <button type="button" className="mt-2 text-xs underline" onClick={() => { setCart([]); setDone(null); setTendered(""); setApplied(false); setCode(""); }}>Start a new {preset === "pos" ? "sale" : "order"}</button>
          </div>
        )}
        <p className="text-[11px] text-muted-foreground">Demo store with sample products. No payment is taken.</p>
      </aside>
      {preset === "wholesale" && cart.some((l) => l.qty >= 50) && <div className="lg:col-span-2"><Toast>Volume pricing applied automatically: trade customers see their own tiered prices.</Toast></div>}
      {Object.keys(byVendor).length > 1 && preset === "marketplace" && <div className="lg:col-span-2"><Badge tone="accent">This order will be split into {Object.keys(byVendor).length} vendor shipments</Badge></div>}
    </div>
  );
}
