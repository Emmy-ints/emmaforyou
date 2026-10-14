import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { Badge, Btn, ListEditor, Panel, RowsEditor, Select, SettingsPanel, Toast, uid, useDemoSetting, type EngineProps } from "./ui";

const SAMPLES: Record<string, { label: string; text: string }> = {
  invoice: { label: "Supplier invoice (scanned text)", text: "DELTA OFFICE SUPPLIES LTD\nInvoice No: INV-20931\nInvoice date: 02/10/2026\nDue date: 01/11/2026\nBill to: Bloom Dental Ltd\nPO Number: PO-7781\n\n20 x Printer paper A4 @ 4.50 = 90.00\n5 x Toner cartridge @ 62.00 = 310.00\n\nSubtotal: 400.00\nVAT 7.5%: 30.00\nTotal due: USD 430.00\nBank: First Bank 3012345678" },
  bank: { label: "Bank statement lines", text: "03 Oct  POS PURCHASE SHOPRITE LEKKI        -45,200\n03 Oct  TRANSFER FROM KORA FASHION LTD        +350,000\n04 Oct  MTN AIRTIME RECHARGE                  -5,000\n05 Oct  POS PURCHASE TOTAL FILLING STATION    -28,000\n06 Oct  GOOGLE ADS                            -60,000\n07 Oct  SALARY OCT - A. OKAFOR                -250,000\n07 Oct  TRANSFER TO DELTA OFFICE SUPPLIES     -430,000" },
  cv: { label: "CV (pasted text)", text: "Amaka Obi\namaka.obi@example.com | +234 803 000 0000 | Lagos\n\nExperience\nSales Manager, Prime Realty — 2021 to present (4 years)\nSales Executive, Kora Fashion — 2018 to 2021\n\nSkills: CRM (HubSpot), negotiation, team leadership, Excel\nEducation: BSc Marketing, University of Lagos\nLanguages: English, Igbo" },
  call: { label: "Sales call transcript", text: "Rep: Thanks for joining. What prompted you to look at a new website?\nClient: Honestly our site is slow and we get almost no enquiries from it.\nRep: Got it. What budget did you have in mind?\nClient: Around 2,000 dollars, but the price feels high compared to a freelancer.\nRep: Understood. We also include the AI chat and three months of support.\nClient: I need to check with my business partner first.\nRep: Of course. I'll send the proposal today and we'll talk again on Thursday." },
  meeting: { label: "Meeting transcript", text: "Chloe: Let's finalise the launch date. We decided on the 15th.\nTunde: I will set up the ads account by Friday.\nAda: I'll write the launch emails and share drafts on Wednesday.\nChloe: Agreed. Budget stays at 3,000 for the first month.\nTunde: Risk: product photos might be late.\nChloe: Ada, please chase the photographer today." },
  survey: { label: "Customer survey answers", text: "Delivery was too slow, took a week.\nLove the quality, but prices are a bit high.\nWould like more sizes for plus-size customers.\nCustomer service on WhatsApp was quick and kind.\nDelivery late again. Please improve.\nPrices high but worth it.\nPlease add pay on delivery outside Lagos.\nGreat packaging and fast replies." },
  reviews: { label: "Product reviews", text: "Battery lasts all day, really impressed. ★★★★★\nCharger stopped working after a month. ★★\nGreat sound but the case scratches easily. ★★★★\nWish it had noise cancelling. ★★★\nBattery life is excellent, comfortable fit. ★★★★★\nConnection drops sometimes. ★★" },
  qa: { label: "Product listing to check", text: "Title: wireless earbuds best price!!!\nPrice: 39\nDescription: amazing earbuds guaranteed 100% best in the world\nCategory:\nImage alt text:\nReturn policy: 14 days" },
};

interface FieldOut { k: string; v: string; conf: number }
const m = (t: string, re: RegExp) => t.match(re)?.[1]?.trim() ?? "";

interface Rule { id: string; match: string; category: string }
const BANK_RULES: Rule[] = [["shoprite, spar, market", "Groceries / supplies"], ["airtime, mtn, airtel, glo", "Phone & internet"], ["filling, fuel, total", "Transport"], ["google ads, meta, facebook", "Marketing"], ["salary", "Payroll"], ["transfer from", "Customer payment"], ["supplies, delta", "Supplier payment"]].map(([match, category], i) => ({ id: `r${i}`, match, category }));
interface Opts { rules: Rule[]; reqs: string[] }

function extract(preset: string, t: string, opts: Opts): { fields?: FieldOut[]; lists?: { title: string; items: { text: string; tone?: "good" | "warn" | "bad" | "neutral" | "accent"; tag?: string }[] }[] } {
  if (preset === "invoice") {
    const f: FieldOut[] = [
      { k: "Supplier", v: t.split("\n")[0].trim(), conf: 0.93 },
      { k: "Invoice number", v: m(t, /invoice\s*no\.?:?\s*([\w-]+)/i), conf: 0.98 },
      { k: "Invoice date", v: m(t, /invoice date:?\s*([\d/.-]+)/i), conf: 0.95 },
      { k: "Due date", v: m(t, /due date:?\s*([\d/.-]+)/i), conf: 0.9 },
      { k: "PO number", v: m(t, /po (?:number|no)\.?:?\s*([\w-]+)/i), conf: 0.88 },
      { k: "Subtotal", v: m(t, /subtotal:?\s*([\d,.]+)/i), conf: 0.96 },
      { k: "Tax", v: m(t, /vat[^:]*:?\s*([\d,.]+)/i), conf: 0.82 },
      { k: "Total", v: m(t, /total due:?\s*(?:[A-Z]{3}\s*)?([\d,.]+)/i), conf: 0.97 },
      { k: "Bank details", v: m(t, /bank:?\s*(.+)/i), conf: 0.62 },
    ].map((x) => (x.v ? x : { ...x, conf: 0 }));
    const sub = Number(f[5].v.replace(/,/g, "")), tax = Number(f[6].v.replace(/,/g, "")), tot = Number(f[7].v.replace(/,/g, ""));
    const lines = [...t.matchAll(/(\d+)\s*x\s*(.+?)\s*@\s*([\d.]+)\s*=\s*([\d.]+)/gi)].map((x) => ({ text: `${x[1]} × ${x[2]} @ ${x[3]} = ${x[4]}`, tone: Math.abs(Number(x[1]) * Number(x[3]) - Number(x[4])) < 0.01 ? "good" as const : "bad" as const, tag: Math.abs(Number(x[1]) * Number(x[3]) - Number(x[4])) < 0.01 ? "Maths checks out" : "Line total mismatch" }));
    const checks = [{ text: sub && tax && tot ? `Subtotal + tax = ${(sub + tax).toFixed(2)} vs total ${tot.toFixed(2)}` : "Totals incomplete", tone: Math.abs(sub + tax - tot) < 0.01 ? "good" as const : "bad" as const, tag: Math.abs(sub + tax - tot) < 0.01 ? "Matches" : "Discrepancy" }, { text: f[4].v ? `Matched to purchase order ${f[4].v}` : "No PO found", tone: f[4].v ? "good" as const : "warn" as const, tag: f[4].v ? "3-way match" : "Needs PO" }];
    return { fields: f, lists: [{ title: "Line items", items: lines }, { title: "Checks", items: checks }] };
  }
  if (preset === "bank") {
    const rules = opts.rules.map((r) => ({ words: r.match.split(",").map((w) => w.trim().toLowerCase()).filter(Boolean), cat: r.category.trim() || "Uncategorised" }));
    const items = t.split("\n").filter((l) => l.trim()).map((l) => { const cat = rules.find((r) => r.words.some((w) => l.toLowerCase().includes(w)))?.cat; return { text: l.replace(/\s{2,}/g, " · "), tag: cat ?? "Uncategorised — review", tone: cat ? (/[+]/.test(l) ? "good" as const : "neutral" as const) : "warn" as const }; });
    return { lists: [{ title: "Categorised transactions", items }] };
  }
  if (preset === "cv") {
    const years = Number(m(t, /\((\d+) years?\)/i)) || 0;
    const skills = m(t, /skills:?\s*(.+)/i);
    const req = opts.reqs.filter((r) => r.trim());
    return {
      fields: [{ k: "Name", v: t.split("\n")[0].trim(), conf: 0.97 }, { k: "Email", v: m(t, /([\w.+-]+@[\w-]+\.[\w.]+)/), conf: 0.99 }, { k: "Phone", v: m(t, /(\+?\d[\d\s]{7,})/), conf: 0.9 }, { k: "Location", v: m(t, /\|\s*([A-Za-z ]+)\s*$/m), conf: 0.7 }, { k: "Current role", v: m(t, /experience\s*\n(.+?)—/i), conf: 0.85 }, { k: "Years in current role", v: years ? String(years) : "", conf: 0.8 }, { k: "Education", v: m(t, /education:?\s*(.+)/i), conf: 0.92 }],
      lists: [{ title: "Match against job requirements (stated qualifications only)", items: req.map((r) => { const hit = t.toLowerCase().includes(r.toLowerCase()) || skills.toLowerCase().includes(r.toLowerCase()); return { text: r, tone: hit ? "good" as const : "warn" as const, tag: hit ? "Mentioned" : "Not mentioned" }; }) }],
    };
  }
  const lines = t.split("\n").map((l) => l.trim()).filter(Boolean);
  if (preset === "call") {
    return { lists: [
      { title: "Pain points", items: lines.filter((l) => /slow|no enquir|problem|struggl|almost no/i.test(l)).map((l) => ({ text: l, tone: "warn" })) },
      { title: "Objections", items: lines.filter((l) => /price|expensive|high|check with|partner|not sure|compare/i.test(l)).map((l) => ({ text: l, tone: "bad", tag: /price|high|expensive|compare/i.test(l) ? "Price" : "Authority" })) },
      { title: "Next steps", items: lines.filter((l) => /send|talk again|follow|thursday|monday|today|tomorrow/i.test(l)).map((l) => ({ text: l, tone: "good" })) },
      { title: "Rubric", items: [{ text: "Asked about the problem", tone: lines.some((l) => /^rep:.*\?/i.test(l) && /what|why/i.test(l)) ? "good" : "bad" }, { text: "Asked about budget", tone: lines.some((l) => /budget/i.test(l)) ? "good" : "bad" }, { text: "Agreed a next step with a date", tone: lines.some((l) => /thursday|monday|tuesday|wednesday|friday|tomorrow/i.test(l)) ? "good" : "bad" }].map((x) => ({ ...x, tag: x.tone === "good" ? "✓" : "Missing" })) as { text: string; tone: "good" | "bad"; tag: string }[] },
    ] };
  }
  if (preset === "meeting") {
    return { lists: [
      { title: "Decisions", items: lines.filter((l) => /decided|agreed|stays at|final/i.test(l)).map((l) => ({ text: l, tone: "accent" })) },
      { title: "Action items", items: lines.filter((l) => /i will|i'll|please|by (monday|tuesday|wednesday|thursday|friday)/i.test(l)).map((l) => { const owner = /please/i.test(l) ? (l.match(/(\w+), please/)?.[1] ?? "?") : l.split(":")[0]; return { text: l.split(":").slice(1).join(":").trim(), tag: `Owner: ${owner}`, tone: "good" as const }; }) },
      { title: "Risks", items: lines.filter((l) => /risk|late|blocker|delay/i.test(l)).map((l) => ({ text: l, tone: "warn" })) },
    ] };
  }
  if (preset === "survey" || preset === "reviews") {
    const themes: [string, RegExp][] = preset === "survey" ? [["Delivery speed", /deliver|late|slow|fast/i], ["Price", /price|expensive|high/i], ["Product range", /size|range|more/i], ["Service", /service|replies|whatsapp|kind/i], ["Payment", /pay on delivery|payment/i]] : [["Battery", /battery/i], ["Charging / hardware", /charger|stopped|case|scratch/i], ["Sound", /sound|noise/i], ["Connection", /connection|drops/i], ["Comfort", /comfort|fit/i]];
    const neg = /slow|late|high|stopped|scratch|drops|wish|improve|too/i;
    return { lists: [
      { title: "Themes", items: themes.map(([n, re]) => { const hits = lines.filter((l) => re.test(l)); const bad = hits.filter((l) => neg.test(l)).length; return { text: `${n} — ${hits.length} mention${hits.length === 1 ? "" : "s"}`, tag: bad > hits.length / 2 ? "Mostly negative" : hits.length ? "Mostly positive" : "—", tone: (bad > hits.length / 2 ? "bad" : hits.length ? "good" : "neutral") as "bad" | "good" | "neutral" }; }).filter((x) => !x.text.includes("— 0")) },
      { title: preset === "survey" ? "Requests" : "Feature requests", items: lines.filter((l) => /would like|please add|wish|add|more/i.test(l)).map((l) => ({ text: l, tone: "accent" })) },
    ] };
  }
  // qa
  const checks: [string, boolean][] = [
    ["Title has no ALL-CAPS or '!!!'", !/!!!|\b[A-Z]{4,}\b/.test(m(t, /title:?\s*(.+)/i))],
    ["Title is descriptive (≥ 4 words)", m(t, /title:?\s*(.+)/i).split(/\s+/).length >= 4],
    ["Price includes currency", /[$€£₦]|usd|ngn|eur/i.test(m(t, /price:?\s*(.+)/i))],
    ["No unverifiable claims ('guaranteed', 'best in the world')", !/guaranteed|best in the world|100%/i.test(t)],
    ["Category filled", !!m(t, /category:[ \t]*(\S.*)/i)],
    ["Image alt text filled", !!m(t, /alt text:[ \t]*(\S.*)/i)],
    ["Return policy stated", !!m(t, /return policy:[ \t]*(\S.*)/i)],
  ];
  return { lists: [{ title: "Rule checks", items: checks.map(([text, ok]) => ({ text, tone: ok ? "good" : "bad", tag: ok ? "Pass" : "Fix" })) }] };
}

const DEST: Record<string, string[]> = { invoice: ["Accounting (QuickBooks)", "Accounting (Xero)", "Google Sheet"], cv: ["Applicant tracking system", "HR spreadsheet"], bank: ["Accounting ledger", "Google Sheet"] };

export default function ExtractDemo(props: EngineProps) {
  const { preset } = props;
  const sample = SAMPLES[preset] ?? SAMPLES.invoice;
  const [threshold, setThreshold] = useDemoSetting(props, "threshold", 0.8);
  const [autoPost, setAutoPost] = useDemoSetting(props, "auto", false);
  const [dest, setDest] = useDemoSetting(props, "dest", (DEST[preset] ?? ["Your system"])[0]);
  const [rules, setRules] = useDemoSetting<Rule[]>(props, "rules", BANK_RULES);
  const [reqs, setReqs] = useDemoSetting<string[]>(props, "reqs", ["CRM", "negotiation", "Excel", "Salesforce"]);
  const [approvalOver, setApprovalOver] = useDemoSetting(props, "approvalOver", 1000);
  const [text, setText] = useState(sample.text);
  const [out, setOut] = useState<ReturnType<typeof extract> | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [approved, setApproved] = useState<string | false>(false);
  const opts: Opts = { rules, reqs };
  // Re-run automatically when rules change, so settings visibly affect the result.
  const result = out ? extract(preset, text, opts) : null;
  const review = result?.fields?.filter((f) => f.conf < threshold) ?? [];
  const total = Number((edits.Total ?? result?.fields?.find((f) => f.k === "Total")?.v ?? "0").replace(/,/g, "")) || 0;
  const needsManager = preset === "invoice" && total > approvalOver;
  const run = () => {
    const r = extract(preset, text, opts);
    setOut(r); setEdits({});
    const low = r.fields?.filter((f) => f.conf < threshold) ?? [];
    const t = Number(r.fields?.find((f) => f.k === "Total")?.v.replace(/,/g, "") ?? 0);
    setApproved(autoPost && r.fields && low.length === 0 && !(preset === "invoice" && t > approvalOver) ? "auto" : false);
  };

  return (
    <div className="space-y-4">
    <SettingsPanel summary={`Review below ${Math.round(threshold * 100)}% confidence${autoPost ? " · auto-post when confident" : ""}`}>
      <div className="grid gap-3 sm:grid-cols-3">
        <Select label="Send to a person when confidence is below" value={String(threshold)} onChange={(e) => setThreshold(Number(e.target.value))} options={[["0.6", "60%"], ["0.7", "70%"], ["0.8", "80%"], ["0.9", "90%"], ["0.95", "95%"]]} />
        {DEST[preset] && <Select label="Post results to" value={dest} onChange={(e) => setDest(e.target.value)} options={DEST[preset]} />}
        {preset === "invoice" && <Select label="Manager approval for totals over" value={String(approvalOver)} onChange={(e) => setApprovalOver(Number(e.target.value))} options={[["100", "100"], ["500", "500"], ["1000", "1,000"], ["5000", "5,000"]]} />}
      </div>
      {DEST[preset] && preset !== "bank" && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={autoPost} onChange={(e) => setAutoPost(e.target.checked)} className="accent-[var(--demo-accent)]" />Post automatically when every field is above the threshold (and no approval is needed)</label>}
      {preset === "bank" && <RowsEditor<Rule> label="Categorisation rules (first match wins)" rows={rules} onChange={setRules} max={10} cols={[{ key: "match", label: "If the line contains (comma-separated)", type: "text" }, { key: "category", label: "Category", type: "text", width: "34%" }]} make={() => ({ id: uid(), match: "uber, bolt", category: "Transport" })} />}
      {preset === "cv" && <ListEditor label="Job requirements to check" items={reqs} onChange={setReqs} min={1} max={8} placeholder="e.g. Spanish" />}
    </SettingsPanel>
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title={sample.label} actions={<Btn variant="ghost" onClick={() => { setText(sample.text); setOut(null); }}>Load sample</Btn>}>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={14} maxLength={4000} aria-label="Document text" className="w-full resize-y rounded-xl border border-border bg-background p-3 font-mono text-xs leading-relaxed outline-none focus:border-[var(--demo-accent)]" />
        <p className="mt-1 text-[11px] text-muted-foreground">Edit the text or paste your own. Demo rules run in your browser; production uses OCR and an AI model, with low-confidence results sent to a person.</p>
        <Btn className="mt-2" onClick={run} disabled={!text.trim()}><Sparkles className="h-4 w-4" />Extract</Btn>
      </Panel>
      <div className="space-y-4">
        {!result ? <Panel><p className="text-sm text-muted-foreground">Press <strong>Extract</strong> to see the structured result.</p></Panel> : (
          <>
            {result.fields && (
              <Panel title="Extracted fields" actions={review.length ? <Badge tone="warn">{review.length} need review</Badge> : <Badge tone="good">High confidence</Badge>}>
                <ul className="space-y-1.5">{result.fields.map((f) => (
                  <li key={f.k} className="grid grid-cols-[120px_1fr_auto] items-center gap-2 text-sm">
                    <span className="text-xs text-muted-foreground">{f.k}</span>
                    <input aria-label={f.k} value={edits[f.k] ?? f.v} onChange={(e) => setEdits({ ...edits, [f.k]: e.target.value })} className={`rounded-md border bg-background px-2 py-1 text-sm ${f.conf < threshold ? "border-amber-500/60" : "border-border"}`} placeholder="Not found" />
                    <Badge tone={f.conf >= Math.max(0.9, threshold) ? "good" : f.conf >= threshold ? "neutral" : "warn"}>{f.conf ? `${Math.round(f.conf * 100)}%` : "missing"}</Badge>
                  </li>))}</ul>
                {needsManager && !approved && <p className="mt-3 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">Total is over {approvalOver.toLocaleString()}: a manager must approve before posting.</p>}
                {approved ? <Toast><Check className="mr-1 inline h-4 w-4" />{approved === "auto" ? `Posted automatically to ${dest} (simulated): all fields were above ${Math.round(threshold * 100)}%.` : `${needsManager ? "Approved by a manager and posted" : "Approved and posted"} to ${dest} (simulated). Corrections are logged for audit.`}</Toast> : <Btn className="mt-3" onClick={() => setApproved("manual")}>{needsManager ? "Approve as manager & post" : review.length ? `Reviewed ${review.length} field${review.length > 1 ? "s" : ""}: approve & post` : "Approve & post"}</Btn>}
              </Panel>
            )}
            {result.lists?.map((l) => (
              <Panel key={l.title} title={l.title}>
                {l.items.length ? <ul className="space-y-1.5">{l.items.map((it, i) => <li key={i} className="flex items-start justify-between gap-2 rounded-lg bg-muted/50 px-2.5 py-1.5 text-sm"><span>{it.text}</span>{it.tag && <Badge tone={it.tone ?? "neutral"}>{it.tag}</Badge>}</li>)}</ul> : <p className="text-sm text-muted-foreground">Nothing found.</p>}
              </Panel>
            ))}
          </>
        )}
      </div>
    </div>
    </div>
  );
}
