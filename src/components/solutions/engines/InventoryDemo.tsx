import { useMemo, useState } from "react";
import { AlertTriangle, ArrowDownUp, Minus, Plus, Search, Share2, Sparkles, Upload, Wand2 } from "lucide-react";
import { Badge, Btn, Panel, Select, Stat, Toast, money, uid, type EngineProps } from "./ui";

interface Item { id: string; sku: string; name: string; cat: string; stock: number; min: number; cost: number; price: number; loc: string; supplier?: string; supplierStock?: number; sales?: number[] }

const STOCK: Record<string, { cur: string; items: Omit<Item, "id">[]; label: string }> = {
  warehouse: { cur: "USD", label: "Warehouse", items: [
    { sku: "TS-BLK-M", name: "T-shirt black M", cat: "Apparel", stock: 42, min: 20, cost: 4, price: 15, loc: "Lagos" },
    { sku: "TS-BLK-L", name: "T-shirt black L", cat: "Apparel", stock: 8, min: 20, cost: 4, price: 15, loc: "Lagos" },
    { sku: "MUG-WHT", name: "Ceramic mug", cat: "Home", stock: 120, min: 40, cost: 2.5, price: 9, loc: "Abuja" },
    { sku: "CAP-NVY", name: "Cap navy", cat: "Apparel", stock: 0, min: 15, cost: 3, price: 12, loc: "Lagos" },
    { sku: "BTL-STL", name: "Steel bottle", cat: "Home", stock: 33, min: 25, cost: 5, price: 18, loc: "Abuja" },
    { sku: "TOTE-NAT", name: "Tote bag", cat: "Accessories", stock: 61, min: 30, cost: 1.8, price: 8, loc: "Lagos" },
  ] },
  dropship: { cur: "USD", label: "Store", items: [
    { sku: "LMP-01", name: "LED desk lamp", cat: "Home", stock: 0, min: 0, cost: 11, price: 29, loc: "—", supplier: "Supplier A", supplierStock: 240 },
    { sku: "EAR-02", name: "Wireless earbuds", cat: "Tech", stock: 0, min: 0, cost: 14, price: 39, loc: "—", supplier: "Supplier B", supplierStock: 0 },
    { sku: "YOG-03", name: "Yoga mat", cat: "Fitness", stock: 0, min: 0, cost: 8, price: 25, loc: "—", supplier: "Supplier A", supplierStock: 12 },
    { sku: "PHN-04", name: "Phone stand", cat: "Tech", stock: 0, min: 0, cost: 3, price: 12, loc: "—", supplier: "Supplier C", supplierStock: 900 },
  ] },
  forecast: { cur: "USD", label: "Store", items: [
    { sku: "COF-1KG", name: "Coffee beans 1kg", cat: "Pantry", stock: 40, min: 20, cost: 9, price: 22, loc: "Main", sales: [18, 22, 25, 29] },
    { sku: "OAT-MLK", name: "Oat milk", cat: "Dairy-free", stock: 60, min: 30, cost: 1.4, price: 3.5, loc: "Main", sales: [40, 38, 41, 39] },
    { sku: "CUP-PAP", name: "Paper cups (100)", cat: "Supplies", stock: 15, min: 10, cost: 4, price: 0, loc: "Main", sales: [6, 8, 9, 12] },
    { sku: "SYR-VAN", name: "Vanilla syrup", cat: "Pantry", stock: 22, min: 8, cost: 5, price: 12, loc: "Main", sales: [5, 4, 3, 3] },
  ] },
  manufacturing: { cur: "USD", label: "Plant", items: [
    { sku: "RM-STEEL", name: "Steel sheet 2mm", cat: "Raw material", stock: 140, min: 100, cost: 22, price: 0, loc: "Store A" },
    { sku: "RM-BOLT", name: "Bolts M8 (box)", cat: "Raw material", stock: 18, min: 30, cost: 6, price: 0, loc: "Store A" },
    { sku: "FG-SHELF", name: "Shelf unit (finished)", cat: "Finished goods", stock: 24, min: 10, cost: 58, price: 140, loc: "Dispatch" },
    { sku: "FG-CAB", name: "Cabinet (finished)", cat: "Finished goods", stock: 6, min: 8, cost: 90, price: 230, loc: "Dispatch" },
  ] },
};

interface Rec { id: string; name: string; fields: Record<string, string> }
const QUALITY: Record<string, { cols: string[]; rows: Record<string, string>[] }> = {
  pim: { cols: ["Title", "Brand", "Colour", "Size", "Material", "Description"], rows: [
    { Title: "Linen shirt", Brand: "Kora", Colour: "White", Size: "M", Material: "Linen", Description: "Breathable linen shirt for warm days." },
    { Title: "linen SHIRT ", Brand: "kora", Colour: "", Size: "L", Material: "", Description: "" },
    { Title: "Ankara dress", Brand: "Kora", Colour: "Multi", Size: "", Material: "Cotton", Description: "Bold print midi dress." },
    { Title: "Leather sandal", Brand: "", Colour: "Tan", Size: "42", Material: "Leather", Description: "Hand-stitched sandal." },
  ] },
  spreadsheet: { cols: ["Name", "Email", "City", "Amount"], rows: [
    { Name: " ada OKAFOR", Email: "ADA@EXAMPLE.COM ", City: "lagos", Amount: "1,200" },
    { Name: "Tunde Bello", Email: "tunde@example.com", City: "Abuja", Amount: "950" },
    { Name: "ada okafor", Email: "ada@example.com", City: "Lagos", Amount: "1200" },
    { Name: "Chloe  Smith", Email: "chloe@example", City: "London ", Amount: "abc" },
  ] },
};

interface FileRow { id: string; name: string; type: string; kb: number; owner: string; shared: boolean; version: number }

export default function InventoryDemo({ preset }: EngineProps) {
  if (preset === "files") return <Files />;
  if (QUALITY[preset]) return <Quality preset={preset} />;
  return <Stock preset={preset} />;
}

function Stock({ preset }: { preset: string }) {
  const cfg = STOCK[preset] ?? STOCK.warehouse;
  const [items, setItems] = useState<Item[]>(() => cfg.items.map((i) => ({ ...i, id: uid() })));
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [sort, setSort] = useState<"name" | "stock">("stock");
  const [po, setPo] = useState<{ sku: string; qty: number }[]>([]);
  const [margin, setMargin] = useState(60);
  const [msg, setMsg] = useState("");
  const isDrop = preset === "dropship";
  const isFc = preset === "forecast";

  const forecast = (it: Item) => { const s = it.sales ?? []; if (s.length < 2) return 0; const trend = (s[s.length - 1] - s[0]) / (s.length - 1); return Math.max(0, Math.round(s[s.length - 1] + trend)); };
  const shown = useMemo(() => items.filter((i) => (cat === "All" || i.cat === cat) && `${i.sku} ${i.name}`.toLowerCase().includes(q.toLowerCase())).sort((a, b) => (sort === "name" ? a.name.localeCompare(b.name) : (isDrop ? (a.supplierStock ?? 0) - (b.supplierStock ?? 0) : a.stock - a.min - (b.stock - b.min)))), [items, cat, q, sort, isDrop]);
  const low = items.filter((i) => (isDrop ? (i.supplierStock ?? 0) < 20 : i.stock <= i.min));
  const value = items.reduce((s, i) => s + i.stock * i.cost, 0);
  const cats = ["All", ...new Set(items.map((i) => i.cat))];
  const adjust = (id: string, d: number) => setItems((is) => is.map((i) => (i.id === id ? { ...i, stock: Math.max(0, i.stock + d) } : i)));
  const suggest = (i: Item) => (isFc ? Math.max(0, forecast(i) * 2 - i.stock) : Math.max(0, i.min * 2 - i.stock));
  const reorderAll = () => { const lines = low.filter((i) => !isDrop).map((i) => ({ sku: i.sku, qty: suggest(i) })).filter((l) => l.qty > 0); setPo(lines); setMsg(lines.length ? `Draft purchase order created with ${lines.length} line${lines.length > 1 ? "s" : ""}.` : "Nothing needs reordering."); };
  const sync = () => { setItems((is) => is.map((i) => ({ ...i, supplierStock: Math.max(0, (i.supplierStock ?? 0) - Math.round((i.supplierStock ?? 0) * 0.1)) }))); setMsg("Supplier stock synced. Items at 0 are hidden from the store automatically."); };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="SKUs" value={items.length} />
        <Stat label={isDrop ? "Low at supplier" : "Low / out of stock"} value={low.length} hint={low.length ? "Needs action" : "All good"} />
        {isDrop ? <Stat label="Margin rule" value={`${margin}%`} hint="Applied to supplier cost" /> : <Stat label="Stock value (cost)" value={money(value, cfg.cur)} />}
        <Stat label="Units on hand" value={items.reduce((s, i) => s + i.stock, 0)} />
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="relative block min-w-[180px] flex-1 text-xs font-medium text-muted-foreground">Search SKU or name
          <Search className="pointer-events-none absolute left-2.5 top-[30px] h-4 w-4" />
          <input value={q} onChange={(e) => setQ(e.target.value)} className="mt-1 block w-full rounded-lg border border-border bg-background py-1.5 pl-8 pr-2.5 text-sm outline-none focus:border-[var(--demo-accent)]" />
        </label>
        <Select label="Category" value={cat} onChange={(e) => setCat(e.target.value)} options={cats} className="w-40" />
        <Btn variant="ghost" onClick={() => setSort(sort === "name" ? "stock" : "name")}><ArrowDownUp className="h-4 w-4" />Sort: {sort === "name" ? "Name" : "Most urgent"}</Btn>
        {isDrop ? <Btn onClick={sync}>Sync supplier stock</Btn> : <Btn onClick={reorderAll}>Create reorder</Btn>}
      </div>
      {isDrop && <label className="block max-w-sm text-xs font-medium text-muted-foreground">Price rule: supplier cost + {margin}% margin<input type="range" min={10} max={150} step={5} value={margin} onChange={(e) => setMargin(Number(e.target.value))} className="mt-2 block w-full accent-[var(--demo-accent)]" /></label>}
      {msg && <Toast>{msg}</Toast>}

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-muted/60 text-xs text-muted-foreground"><tr>
            <th className="p-2.5">SKU</th><th className="p-2.5">Item</th>
            {isDrop ? <><th className="p-2.5">Supplier</th><th className="p-2.5">Supplier stock</th><th className="p-2.5">Your price</th></>
              : <><th className="p-2.5">{cfg.label}</th><th className="p-2.5">On hand</th>{isFc ? <th className="p-2.5">Last 4 weeks → next week</th> : <th className="p-2.5">Reorder at</th>}<th className="p-2.5">Suggested order</th></>}
            <th className="p-2.5">Status</th>
          </tr></thead>
          <tbody>{shown.map((i) => {
            const out = isDrop ? (i.supplierStock ?? 0) === 0 : i.stock === 0;
            const lowish = isDrop ? (i.supplierStock ?? 0) < 20 : i.stock <= i.min;
            return (
              <tr key={i.id} className="border-t border-border">
                <td className="p-2.5 font-mono text-xs">{i.sku}</td><td className="p-2.5 font-medium">{i.name}<span className="block text-[11px] text-muted-foreground">{i.cat}</span></td>
                {isDrop ? <><td className="p-2.5">{i.supplier}</td><td className="p-2.5">{i.supplierStock}</td><td className="p-2.5">{money(Math.round(i.cost * (1 + margin / 100) * 100) / 100, cfg.cur)}</td></> : <>
                  <td className="p-2.5">{i.loc}</td>
                  <td className="p-2.5"><div className="flex items-center gap-1"><button type="button" aria-label={`Remove one ${i.name}`} onClick={() => adjust(i.id, -1)} className="rounded-full border border-border p-0.5"><Minus className="h-3 w-3" /></button><span className="w-8 text-center font-semibold">{i.stock}</span><button type="button" aria-label={`Add one ${i.name}`} onClick={() => adjust(i.id, 1)} className="rounded-full border border-border p-0.5"><Plus className="h-3 w-3" /></button></div></td>
                  <td className="p-2.5 text-muted-foreground">{isFc ? `${(i.sales ?? []).join(", ")} → ${forecast(i)}` : i.min}</td>
                  <td className="p-2.5">{suggest(i) || "—"}</td></>}
                <td className="p-2.5">{out ? <Badge tone="bad"><AlertTriangle className="h-3 w-3" />{isDrop ? "Hidden (out at supplier)" : "Out of stock"}</Badge> : lowish ? <Badge tone="warn">Low</Badge> : <Badge tone="good">OK</Badge>}</td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>

      {po.length > 0 && (
        <Panel title="Draft purchase order" actions={<Btn variant="ghost" onClick={() => setPo([])}>Discard</Btn>}>
          <ul className="text-sm">{po.map((l) => <li key={l.sku} className="flex justify-between border-b border-border py-1.5 last:border-0"><span className="font-mono text-xs">{l.sku}</span><span>{l.qty} units</span></li>)}</ul>
          <Btn className="mt-3" onClick={() => { setItems((is) => is.map((i) => { const l = po.find((p) => p.sku === i.sku); return l ? { ...i, stock: i.stock + l.qty } : i; })); setPo([]); setMsg("Goods received: stock updated."); }}>Mark as received</Btn>
        </Panel>
      )}
    </div>
  );
}

function Quality({ preset }: { preset: string }) {
  const cfg = QUALITY[preset];
  const [rows, setRows] = useState<Rec[]>(() => cfg.rows.map((r, i) => ({ id: uid(), name: `Row ${i + 1}`, fields: { ...r } })));
  const [log, setLog] = useState<string[]>([]);
  const missing = (r: Rec) => cfg.cols.filter((c) => !r.fields[c]?.trim());
  const complete = Math.round((rows.reduce((s, r) => s + (cfg.cols.length - missing(r).length), 0) / (rows.length * cfg.cols.length || 1)) * 100);
  const title = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());

  const fix = () => {
    const changes: string[] = [];
    let next = rows.map((r) => {
      const f = { ...r.fields };
      for (const c of cfg.cols) {
        const before = f[c] ?? "";
        let v = before;
        if (/name|title|city|brand/i.test(c)) v = title(v);
        if (/email/i.test(c)) v = v.trim().toLowerCase();
        if (/amount/i.test(c)) v = v.replace(/,/g, "");
        if (v !== before) { f[c] = v; changes.push(`${r.name}: ${c} "${before}" → "${v}"`); }
      }
      return { ...r, fields: f };
    });
    if (preset === "spreadsheet") {
      const seen = new Set<string>();
      next = next.filter((r) => { const k = r.fields.Email; if (seen.has(k)) { changes.push(`Removed duplicate: ${r.fields.Name} (${k})`); return false; } seen.add(k); return true; });
    }
    setRows(next);
    setLog(changes.length ? changes : ["Nothing to clean."]);
  };

  const flags = (r: Rec) => {
    const out: string[] = [];
    if (preset === "spreadsheet") {
      if (r.fields.Email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.fields.Email)) out.push("Invalid email");
      if (r.fields.Amount && Number.isNaN(Number(r.fields.Amount.replace(/,/g, "")))) out.push("Amount isn't a number");
    } else missing(r).forEach((m) => out.push(`Missing ${m.toLowerCase()}`));
    return out;
  };
  const total = preset === "spreadsheet" ? rows.reduce((s, r) => s + (Number(r.fields.Amount.replace(/,/g, "")) || 0), 0) : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat label="Records" value={rows.length} />
        <Stat label={preset === "spreadsheet" ? "Rows with problems" : "Completeness"} value={preset === "spreadsheet" ? rows.filter((r) => flags(r).length).length : `${complete}%`} />
        {preset === "spreadsheet" ? <Stat label="=SUM(Amount)" value={total.toLocaleString()} hint="Formula on cleaned data" /> : <Stat label="Ready to publish" value={rows.filter((r) => !missing(r).length).length} />}
      </div>
      <div className="flex flex-wrap gap-2"><Btn onClick={fix}><Wand2 className="h-4 w-4" />{preset === "spreadsheet" ? "Clean data (trim, case, dedupe)" : "Normalise titles & brands"}</Btn></div>
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-muted/60 text-xs text-muted-foreground"><tr>{cfg.cols.map((c) => <th key={c} className="p-2.5">{c}</th>)}<th className="p-2.5">Checks</th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.id} className="border-t border-border align-top">
              {cfg.cols.map((c) => <td key={c} className="p-1.5"><input aria-label={`${r.name} ${c}`} value={r.fields[c] ?? ""} onChange={(e) => setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, fields: { ...x.fields, [c]: e.target.value } } : x)))} className={`w-full rounded-md border bg-background px-2 py-1 text-sm outline-none focus:border-[var(--demo-accent)] ${!r.fields[c]?.trim() ? "border-amber-500/60" : "border-transparent"}`} /></td>)}
              <td className="p-2.5">{flags(r).length ? <div className="flex flex-wrap gap-1">{flags(r).map((f) => <Badge key={f} tone="warn">{f}</Badge>)}</div> : <Badge tone="good">OK</Badge>}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {log.length > 0 && <Panel title={<span className="flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-[var(--demo-accent)]" />Change log</span>}><ul className="space-y-1 text-xs text-muted-foreground">{log.map((l, i) => <li key={i}>• {l}</li>)}</ul></Panel>}
    </div>
  );
}

function Files() {
  const [files, setFiles] = useState<FileRow[]>(() => [
    { id: uid(), name: "Brand guidelines.pdf", type: "PDF", kb: 2400, owner: "Design", shared: false, version: 3 },
    { id: uid(), name: "Q3 report.xlsx", type: "Sheet", kb: 380, owner: "Finance", shared: true, version: 7 },
    { id: uid(), name: "Contract — Acme.docx", type: "Doc", kb: 120, owner: "Legal", shared: false, version: 2 },
    { id: uid(), name: "Product photos.zip", type: "Archive", kb: 48200, owner: "Marketing", shared: true, version: 1 },
  ]);
  const [link, setLink] = useState("");
  const [q, setQ] = useState("");
  const shown = files.filter((f) => f.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="relative block min-w-[200px] flex-1 text-xs font-medium text-muted-foreground">Search files<Search className="pointer-events-none absolute left-2.5 top-[30px] h-4 w-4" /><input value={q} onChange={(e) => setQ(e.target.value)} className="mt-1 block w-full rounded-lg border border-border bg-background py-1.5 pl-8 pr-2.5 text-sm outline-none focus:border-[var(--demo-accent)]" /></label>
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[var(--demo-accent)] px-3.5 py-1.5 text-sm font-semibold text-white"><Upload className="h-4 w-4" />Upload<input type="file" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) setFiles((fs) => [{ id: uid(), name: f.name, type: f.name.split(".").pop()?.toUpperCase() ?? "File", kb: Math.max(1, Math.round(f.size / 1024)), owner: "You", shared: false, version: 1 }, ...fs]); e.target.value = ""; }} /></label>
      </div>
      <p className="text-[11px] text-muted-foreground">Uploads stay in your browser for this demo; nothing is sent anywhere.</p>
      {link && <Toast>Sharing link (expires in 7 days): {link}</Toast>}
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-muted/60 text-xs text-muted-foreground"><tr><th className="p-2.5">Name</th><th className="p-2.5">Owner</th><th className="p-2.5">Size</th><th className="p-2.5">Version</th><th className="p-2.5">Access</th><th className="p-2.5" /></tr></thead>
          <tbody>{shown.map((f) => (
            <tr key={f.id} className="border-t border-border">
              <td className="p-2.5 font-medium">{f.name}<span className="ml-1.5 text-[11px] text-muted-foreground">{f.type}</span></td><td className="p-2.5">{f.owner}</td><td className="p-2.5">{f.kb > 1024 ? `${(f.kb / 1024).toFixed(1)} MB` : `${f.kb} KB`}</td>
              <td className="p-2.5"><button type="button" onClick={() => setFiles((fs) => fs.map((x) => (x.id === f.id ? { ...x, version: x.version + 1 } : x)))} className="text-[var(--demo-accent)] underline-offset-2 hover:underline">v{f.version} (+ new version)</button></td>
              <td className="p-2.5"><button type="button" onClick={() => setFiles((fs) => fs.map((x) => (x.id === f.id ? { ...x, shared: !x.shared } : x)))}>{f.shared ? <Badge tone="warn">Shared</Badge> : <Badge tone="good">Private</Badge>}</button></td>
              <td className="p-2.5"><Btn variant="ghost" onClick={() => setLink(`https://files.example/s/${f.id.slice(-6)}`)} className="!px-2 !py-1 !text-xs"><Share2 className="h-3.5 w-3.5" />Link</Btn></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
