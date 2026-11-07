// @ts-nocheck -- generated DB types lag behind; runtime verified
import { useMemo, useState } from "react";
import { Card, ErrorText, Pill } from "@/components/agents-admin/shared";
import { pageIndex } from "@/lib/page-index";
import { PAGE_TYPES, founderConfig, pageType } from "@/lib/founder-presence";
import { FounderMark } from "@/components/future/FounderPresence";
import { clean, Field, PendingBar, SettingActions, useSettingRows, type Row, type SettingRow } from "./settings";

/**
 * Control room → Content → Founder portrait. Uses the existing settings system (draft → "Preview on site"
 * in your own browser → publish → history/rollback). Keys: founder, founder:<page type>, founder:/path.
 */
const PLACEMENTS = [["", "Inherit"], ["auto", "Automatic (best free spot)"], ["signature", "Portrait signature in the hero"], ["watermark", "Faded portrait (dark heroes, wide screens)"], ["byline", "Founder row under the hero"]] as const;
const SIZES = [["", "Inherit"], ["sm", "Small"], ["md", "Medium"], ["lg", "Large"]] as const;

export default function FounderMgr() {
  const rows = useSettingRows("founder");
  const map = rows.map;
  const current = (k: string): Row => (map.get(k)?.draft ?? map.get(k)?.published ?? {}) as Row;
  const g = current("founder");
  const live = useMemo(() => { const s: Row = {}; for (const [k, r] of map) s[k] = r.draft ?? r.published; return s; }, [map]);
  const pages = useMemo(() => pageIndex().filter((p) => p.href.startsWith("/")).map((p) => p.href), []);
  const pathKeys = [...map.keys()].filter((k) => k.startsWith("founder:/"));
  const [newPath, setNewPath] = useState("");
  const [testPath, setTestPath] = useState("/services");
  const eff = founderConfig(live, testPath);
  return (
    <div className="space-y-4">
      <PendingBar rows={(rows.data ?? []) as SettingRow[]} onDone={rows.reload} scope="founder portrait" />
      <ErrorText message={rows.error} onRetry={rows.reload} />
      <Card title="Founder portrait — everywhere">
        <p className="mb-3 text-sm text-muted-foreground">Your real photo appears on every public page: in the logo, hand-placed on the homepage and About heroes, and on all other pages through one site-wide component that finds a free spot in each page's hero (it never covers text, buttons or images; if there's no room it adds a slim founder row under the hero). New pages inherit it automatically. Drafts only show in your browser via <em>Preview on site</em> until you publish.</p>
        <Editor k="founder" row={map.get("founder")} value={g} onDone={rows.reload} withOn />
        <div className="mt-4 grid gap-3 rounded-xl border border-border bg-muted/30 p-3 md:grid-cols-[1fr_auto]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Preview (current drafts)</p>
            <div className="mt-2 flex flex-wrap items-end gap-4">
              <div className="w-[300px] rounded-xl bg-background p-3"><div style={{ width: 280 }}><FounderMark kind="signature" tone="light" size={(g.size as never) || "md"} role="Founder · reads every brief personally" href="/about" /></div></div>
              <div className="w-[300px] rounded-xl p-3" style={{ background: "#0b0d24" }}><div style={{ width: 280 }}><FounderMark kind="signature" tone="dark" size={(g.size as never) || "md"} role="Founder of EmmaForYou" href="/about" /></div></div>
              <div className="rounded-xl p-3" style={{ background: "#0b0d24" }}><FounderMark kind="watermark" tone="dark" size={(g.size as never) || "md"} role="Founder · reads every brief personally" href="/about" /></div>
            </div>
          </div>
          <div className="min-w-[240px] text-sm">
            <Field label="Check a page"><input className="input" value={testPath} onChange={(e) => setTestPath(e.target.value)} list="fp-pages" aria-label="Page address to check" /></Field>
            <p className="mt-2 text-xs text-muted-foreground">Type: <strong>{pageType(testPath).name}</strong><br />Shown: <strong>{eff.on ? "yes" : "no"}</strong> · placement: <strong>{eff.placement}</strong> · size: <strong>{eff.size}</strong></p>
            {(eff.type === "home" || eff.type === "about") && <p className="mt-1 text-xs text-muted-foreground">This page has a hand-placed portrait in its hero.</p>}
          </div>
        </div>
      </Card>
      <Card title="By page type">
        <ul className="divide-y divide-border">
          {PAGE_TYPES.filter((t) => t.id !== "home" && t.id !== "about").map((t) => (
            <li key={t.id} className="py-3">
              <p className="mb-2 flex flex-wrap items-center gap-2 text-sm font-medium">{t.name}<Pill>default: {t.placement}</Pill>{t.role && <span className="text-xs font-normal text-muted-foreground">caption “{t.role}”</span>}</p>
              <Editor k={`founder:${t.id}`} row={map.get(`founder:${t.id}`)} value={current(`founder:${t.id}`)} onDone={rows.reload} withOn />
            </li>
          ))}
        </ul>
      </Card>
      <Card title="Specific pages">
        <p className="mb-3 text-sm text-muted-foreground">Override one page (<code>/pricing</code>) or a whole branch (<code>/solutions/websites/*</code>). Page rules win over page-type and global settings.</p>
        <div className="mb-3 flex flex-wrap gap-2">
          <input className="input w-auto flex-1" value={newPath} onChange={(e) => setNewPath(e.target.value.trim())} placeholder="/path or /branch/*" list="fp-pages" aria-label="Page address" />
          <datalist id="fp-pages">{pages.map((p) => <option key={p} value={p} />)}</datalist>
        </div>
        {newPath && /^\/[A-Za-z0-9/_.$-]{0,120}(\/\*)?$/.test(newPath) && !map.has(`founder:${newPath}`) && (
          <div className="mb-3 rounded-xl border border-dashed border-border p-3"><p className="mb-2 text-sm font-medium">New rule for <code>{newPath}</code></p><Editor k={`founder:${newPath}`} value={{ on: true }} onDone={() => { setNewPath(""); rows.reload(); }} withOn /></div>
        )}
        {!pathKeys.length ? <p className="text-sm text-muted-foreground">No page rules yet.</p> : (
          <ul className="divide-y divide-border">{pathKeys.map((k) => <li key={k} className="py-3"><p className="mb-2 font-mono text-sm">{k.slice("founder:".length)}</p><Editor k={k} row={map.get(k)} value={current(k)} onDone={rows.reload} withOn /></li>)}</ul>
        )}
      </Card>
    </div>
  );
}

function Editor({ k, row, value, onDone, withOn }: { k: string; row?: SettingRow; value: Row; onDone: () => void; withOn?: boolean }) {
  const [v, setV] = useState<Row>(value);
  const on = v.on === undefined ? "" : v.on ? "on" : "off";
  return (
    <div className="flex flex-wrap items-end gap-3" data-founder-key={k}>
      {withOn && <Field label="Show portrait"><select className="input w-auto" value={on} onChange={(e) => setV({ ...v, on: e.target.value === "" ? undefined : e.target.value === "on" })}><option value="">{k === "founder" ? "On (default)" : "Inherit"}</option><option value="on">On</option><option value="off">Off</option></select></Field>}
      <Field label="Placement"><select className="input w-auto" value={v.placement ?? ""} onChange={(e) => setV({ ...v, placement: e.target.value || undefined })}>{PLACEMENTS.map(([id, l]) => <option key={id} value={id}>{l}</option>)}</select></Field>
      <Field label="Size"><select className="input w-auto" value={v.size ?? ""} onChange={(e) => setV({ ...v, size: e.target.value || undefined })}>{SIZES.map(([id, l]) => <option key={id} value={id}>{l}</option>)}</select></Field>
      <SettingActions k={k} row={row} value={clean(v)} onDone={onDone} />
    </div>
  );
}
