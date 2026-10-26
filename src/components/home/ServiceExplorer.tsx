import { useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight, RotateCcw, Search } from "lucide-react";
import SectionHead from "../future/SectionHead";
import { FAMILIES, catalog, withOverrides, type FamilyId } from "@/lib/service-catalog";
import { useFlag, useSettings } from "@/lib/site-settings";
import { prefersReduced } from "@/lib/motion";

const STEP = 360 / FAMILIES.length;

/**
 * The full service catalogue as an explorable map. A turning ring (positions drawn in perspective) of the nine capability families
 * (drag or swipe to turn it, use the arrow buttons or keys, click a family to open it, reset the
 * view), beside a searchable directory where every service, expertise page and solution area
 * expands to its summary, platforms and a link to its real page. With reduced motion the ring
 * becomes a flat set of buttons; everything is reachable by keyboard.
 */
export default function ServiceExplorer() {
  const settings = useSettings();
  const showWorld = useFlag("explore-world");
  const items = useMemo(() => withOverrides(catalog(), settings), [settings]);
  const [family, setFamily] = useState<FamilyId>("web");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [ry, setRy] = useState(0);
  const drag = useRef<{ x: number; ry: number; moved: boolean } | null>(null);
  const [dragging, setDragging] = useState(false);
  const justDragged = useRef(false);

  const query = q.trim().toLowerCase();
  const shown = query
    ? items.filter((i) => `${i.name} ${i.short} ${i.detail ?? ""} ${i.tools.join(" ")} ${FAMILIES.find((f) => f.id === i.family)?.name}`.toLowerCase().includes(query))
    : items.filter((i) => i.family === family);
  const fam = FAMILIES.find((f) => f.id === family)!;

  const focusFamily = (id: FamilyId) => {
    const i = FAMILIES.findIndex((f) => f.id === id);
    setFamily(id); setQ(""); setOpen(null);
    // Turn the ring the short way round so the chosen family faces the visitor.
    setRy((cur) => { const target = -i * STEP; const d = ((target - cur) % 360 + 540) % 360 - 180; return cur + d; });
  };
  const step = (d: number) => { const i = FAMILIES.findIndex((f) => f.id === family); focusFamily(FAMILIES[(i + d + FAMILIES.length) % FAMILIES.length].id); };

  return (
    <section id="service-explorer" className="sex section-padding" aria-labelledby="sex-h">
      <div className="mx-auto max-w-7xl">
        <SectionHead id="sex-h" align="center" className="max-w-3xl" kicker={`Full catalogue · ${items.length} services and solution areas`}
          title="Explore every service on one map" shine={["every", "service"]}
          sub="Websites, ecommerce, UI/UX, AI agents, automation, apps, marketing, Web3 and strategy. Turn the map, pick an area, or search for exactly what you need." />

        {showWorld && <p className="mt-4 text-center"><Link to="/explore" className="nav-ghost h-auto px-5 py-2 text-sm">Prefer to wander? Enter the 3D service world <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></p>}
        <div className="sex-grid mt-12">
          <div className="sex-stage lg-strong">
            <div className={`sex-viewport ${dragging ? "is-dragging" : ""}`}
              onPointerDown={(e) => { if (prefersReduced()) return; drag.current = { x: e.clientX, ry, moved: false }; }}
              onPointerMove={(e) => { const d = drag.current; if (!d) return; const dx = e.clientX - d.x; if (!d.moved && Math.abs(dx) > 6) { d.moved = true; setDragging(true); (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } if (d.moved) setRy(d.ry + dx * 0.45); }}
              onPointerUp={() => { const d = drag.current; drag.current = null; setDragging(false); if (!d?.moved) return; justDragged.current = true; window.setTimeout(() => { justDragged.current = false; }, 50);
                // Settle on the family nearest the front.
                const idx = ((Math.round(-ry / STEP) % FAMILIES.length) + FAMILIES.length) % FAMILIES.length; setFamily(FAMILIES[idx].id); setRy(Math.round(ry / STEP) * STEP); }}
              onPointerCancel={() => { drag.current = null; setDragging(false); }}
              style={{ touchAction: "pan-y" }}>
              <div className="sex-ring" role="group" aria-label="Service families">
                {FAMILIES.map((f, i) => {
                  const a = i * STEP;
                  const rad = ((a + ry) * Math.PI) / 180;
                  const depth = Math.cos(rad); // 1 = front, -1 = back
                  return (
                    <button key={f.id} type="button" className="sex-node" aria-pressed={family === f.id}
                      onClick={() => { if (!justDragged.current) focusFamily(f.id); }}
                      style={{ ["--sx" as string]: Math.sin(rad).toFixed(4), ["--hue" as string]: f.hue, ["--depth" as string]: depth.toFixed(3), zIndex: Math.round((depth + 1) * 10) }}>
                      <span className="sex-node-icon" aria-hidden="true">{f.icon}</span>
                      <span className="sex-node-name">{f.name}</span>
                      <span className="sex-node-count">{items.filter((x) => x.family === f.id).length}</span>
                    </button>
                  );
                })}
              </div>
              <div className="sex-core" aria-hidden="true" style={{ ["--hue" as string]: fam.hue }}><span /><span /></div>
            </div>
            <div className="sex-controls">
              <button type="button" onClick={() => step(-1)} aria-label="Previous service family"><ChevronLeft className="h-4 w-4" aria-hidden="true" /></button>
              <span className="sex-hint" aria-live="polite"><span className="sex-hint-drag">Drag to turn · </span>{fam.name}</span>
              <button type="button" onClick={() => step(1)} aria-label="Next service family"><ChevronRight className="h-4 w-4" aria-hidden="true" /></button>
              <button type="button" onClick={() => focusFamily(FAMILIES[0].id)} aria-label="Reset the map view" title="Reset view"><RotateCcw className="h-4 w-4" aria-hidden="true" /></button>
            </div>
          </div>

          <div className="sex-panel" style={{ ["--hue" as string]: query ? "#8b7bff" : fam.hue }}>
            <label className="sex-search lg">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="sr-only">Search all services</span>
              <input type="search" value={q} onChange={(e) => { setQ(e.target.value); setOpen(null); }} placeholder="Search: Shopify, Web3, UI/UX, chatbot, SEO…" maxLength={60} />
            </label>
            <div className="sex-head" aria-live="polite">
              {query ? <p className="text-sm text-muted-foreground">{shown.length} {shown.length === 1 ? "match" : "matches"} for “{q.trim()}”</p> : (
                <>
                  <p className="sex-fam"><span aria-hidden="true">{fam.icon}</span> {fam.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{fam.short}</p>
                </>
              )}
            </div>
            <ul className="sex-list">
              {shown.map((it) => {
                const isOpen = open === it.id;
                const f = FAMILIES.find((x) => x.id === it.family)!;
                return (
                  <li key={it.id} className={`sex-item ${isOpen ? "is-open" : ""}`} style={{ ["--hue" as string]: f.hue }}>
                    <button type="button" className="sex-item-q" aria-expanded={isOpen} aria-controls={`sex-${it.id}`} onClick={() => setOpen(isOpen ? null : it.id)}>
                      <span className="sex-item-icon" aria-hidden="true">{it.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-[0.98rem] font-semibold text-foreground">{it.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">{it.short}</span>
                      </span>
                      <span className="sex-kind">{it.kind}</span>
                      <ChevronDown className="sex-chev h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    </button>
                    <div id={`sex-${it.id}`} className="acc-panel" data-open={isOpen} inert={!isOpen}>
                      <div>
                        <div className="px-4 pb-4 pl-[3.6rem]">
                          {it.detail && <p className="text-sm leading-relaxed text-muted-foreground">{it.detail}</p>}
                          {it.tools.length > 0 && <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Platforms and tools">{it.tools.slice(0, 10).map((t) => <li key={t} className="sv-tag">{t}</li>)}</ul>}
                          <Link to={it.href} className="sex-go">Open {it.name} <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
              {!shown.length && <li className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">Nothing matches that yet. Try another word, or <Link to="/contact" className="font-semibold text-[var(--emma-violet)]">ask Emmanuel directly</Link>.</li>}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
