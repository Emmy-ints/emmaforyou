import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, LayoutGrid, Minus, Plus, RotateCcw, RotateCw, X } from "lucide-react";
import { pageHead } from "@/lib/seo";
import { FAMILIES, catalog, withOverrides, type FamilyId } from "@/lib/service-catalog";
import { useFlag, useSettings } from "@/lib/site-settings";
import { prefersReduced } from "@/lib/motion";

export const Route = createFileRoute("/explore")({
  head: () => pageHead({ title: "Explore EmmaForYou in 3D — every service as a district | EmmaForYou", description: "An optional, interactive 3D map of EmmaForYou's nine service areas. Turn, zoom and open any district to reach the real service pages.", path: "/explore" }),
  component: ExplorePage,
});

/** District positions on the 1000×1000 ground plane (a ring around a central plaza). */
const POS: Record<FamilyId, [number, number]> = Object.fromEntries(FAMILIES.map((f, i) => {
  const a = (i / FAMILIES.length) * Math.PI * 2 - Math.PI / 2;
  return [f.id, [500 + Math.cos(a) * 330, 500 + Math.sin(a) * 330]];
})) as Record<FamilyId, [number, number]>;

/**
 * An optional digital world for browsing the catalogue: nine districts (one per service family)
 * on a tilted ground plane, each with a tower per service. Drag or use the buttons/arrow keys to
 * turn, +/− or the wheel to zoom, click or Tab to a district to open it. Everything is real DOM
 * with CSS 3D (no WebGL), so it's light and keyboard-accessible; "Simple view" (automatic with
 * reduced motion) shows the same content as cards. Exit returns to the normal site any time.
 */
function ExplorePage() {
  const on = useFlag("explore-world");
  const settings = useSettings();
  const items = useMemo(() => withOverrides(catalog(), settings), [settings]);
  const [simple, setSimple] = useState(false);
  const [rz, setRz] = useState(-20);
  const [zoom, setZoom] = useState(1);
  const [focus, setFocus] = useState<FamilyId | null>(null);
  const drag = useRef<{ x: number; rz: number; moved: boolean } | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => { if (prefersReduced()) setSimple(true); }, []);
  useEffect(() => { if (focus) panel.current?.focus(); }, [focus]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const tgt = e.target as Element | null;
      if (tgt && typeof tgt.closest === "function" && tgt.closest("input, textarea, select")) return;
      if (e.key === "Escape") setFocus(null);
      if (simple) return;
      if (e.key === "ArrowLeft") setRz((x) => x - 15);
      if (e.key === "ArrowRight") setRz((x) => x + 15);
      if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(1.8, z + 0.15));
      if (e.key === "-") setZoom((z) => Math.max(0.6, z - 0.15));
    };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, [simple]);

  const fam = FAMILIES.find((f) => f.id === focus);
  const list = focus ? items.filter((i) => i.family === focus) : [];
  const [cx, cy] = focus ? POS[focus] : [500, 500];

  if (!on) return (
    <main id="main-content" className="xw-off"><h1 className="font-display text-2xl font-semibold">The 3D service world is switched off right now.</h1><p className="mt-2 text-muted-foreground">Every service is on the <Link to="/services" className="font-semibold text-[var(--emma-violet)]">services page</Link>.</p></main>
  );

  return (
    <main id="main-content" className={`xw ${simple ? "is-simple" : ""}`} aria-labelledby="xw-h">
      <header className="xw-bar">
        <Link to="/" className="xw-brand">EmmaForYou<span>.</span></Link>
        <h1 id="xw-h" className="xw-title">Service world <span className="xw-beta">Beta</span></h1>
        <div className="xw-actions">
          <button type="button" onClick={() => { setSimple((s) => !s); setFocus(null); }} aria-pressed={simple} className="xw-btn"><LayoutGrid className="h-4 w-4" aria-hidden="true" /><span>{simple ? "3D view" : "Simple view"}</span></button>
          <Link to="/services" className="xw-btn xw-exit"><X className="h-4 w-4" aria-hidden="true" /><span>Exit to site</span></Link>
        </div>
      </header>

      {simple ? (
        <section className="xw-simple" aria-label="All service areas">
          <p className="text-sm text-muted-foreground">The same map as cards. Open any area to see its services.</p>
          <ul className="xw-grid">{FAMILIES.map((f) => { const n = items.filter((i) => i.family === f.id); return (
            <li key={f.id} style={{ ["--hue" as string]: f.hue }} className="xw-card">
              <p className="font-display text-lg font-semibold"><span aria-hidden="true">{f.icon}</span> {f.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{f.short}</p>
              <ul className="mt-3 space-y-1">{n.map((i) => <li key={i.id}><Link to={i.href} className="xw-link">{i.name}<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link></li>)}</ul>
            </li>); })}</ul>
        </section>
      ) : (
        <div className="xw-stage"
          onPointerDown={(e) => { drag.current = { x: e.clientX, rz, moved: false }; }}
          onPointerMove={(e) => { const d = drag.current; if (!d) return; const dx = e.clientX - d.x; if (!d.moved && Math.abs(dx) > 6) { d.moved = true; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } if (d.moved) setRz(d.rz + dx * 0.3); }}
          onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}
          onWheel={(e) => setZoom((z) => Math.max(0.6, Math.min(1.8, z - e.deltaY * 0.0012)))}
          style={{ touchAction: "pan-y" }}>
          <div className="xw-sky" aria-hidden="true" />
          <div className="xw-world" style={{ ["--rz" as string]: `${rz}deg`, ["--zoom" as string]: zoom, ["--fx" as string]: `${500 - cx}px`, ["--fy" as string]: `${500 - cy}px` }}>
            <div className="xw-ground" aria-hidden="true"><div className="xw-plaza" /></div>
            {FAMILIES.map((f) => {
              const [x, y] = POS[f.id]; const n = items.filter((i) => i.family === f.id);
              return (
                <div key={f.id} className={`xw-district ${focus === f.id ? "is-focus" : ""}`} style={{ left: x, top: y, ["--hue" as string]: f.hue }}>
                  <span className="xw-pad" aria-hidden="true" />
                  {n.slice(0, 6).map((_, k) => <span key={k} className="xw-tower" aria-hidden="true" style={{ ["--k" as string]: k, ["--h" as string]: `${40 + ((k * 37) % 50)}px` }} />)}
                  <button type="button" className="xw-hotspot" onClick={() => setFocus(f.id)} aria-label={`${f.name}: ${n.length} services`} aria-pressed={focus === f.id}>
                    <span className="xw-hot-icon" aria-hidden="true">{f.icon}</span><span className="xw-hot-name">{f.name}</span><span className="xw-hot-n">{n.length}</span>
                  </button>
                </div>
              );
            })}
          </div>
          <div className="xw-controls" role="group" aria-label="Map controls">
            <button type="button" className="xw-btn" onClick={() => setRz((x) => x - 30)} aria-label="Turn left"><RotateCcw className="h-4 w-4" aria-hidden="true" /></button>
            <button type="button" className="xw-btn" onClick={() => setRz((x) => x + 30)} aria-label="Turn right"><RotateCw className="h-4 w-4" aria-hidden="true" /></button>
            <button type="button" className="xw-btn" onClick={() => setZoom((z) => Math.min(1.8, z + 0.2))} aria-label="Zoom in"><Plus className="h-4 w-4" aria-hidden="true" /></button>
            <button type="button" className="xw-btn" onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))} aria-label="Zoom out"><Minus className="h-4 w-4" aria-hidden="true" /></button>
            <button type="button" className="xw-btn" onClick={() => { setRz(-20); setZoom(1); setFocus(null); }}>Reset</button>
          </div>
          <p className="xw-hint">Drag to turn · scroll or +/− to zoom · Tab to a district · Esc to step back</p>
        </div>
      )}

      {fam && !simple && (
        <aside ref={panel} tabIndex={-1} className="xw-panel" style={{ ["--hue" as string]: fam.hue }} aria-label={`${fam.name} services`}>
          <button type="button" className="xw-close" onClick={() => setFocus(null)} aria-label="Close"><X className="h-4 w-4" aria-hidden="true" /></button>
          <p className="font-display text-xl font-semibold"><span aria-hidden="true">{fam.icon}</span> {fam.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">{fam.short}</p>
          <ul className="mt-4 space-y-2">{list.map((i) => <li key={i.id}><Link to={i.href} className="xw-item"><span className="min-w-0"><span className="block font-semibold">{i.name}</span><span className="block truncate text-xs text-muted-foreground">{i.short}</span></span><ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" /></Link></li>)}</ul>
          <Link to="/book" className="btn-primary-gradient mt-5 inline-flex rounded-full px-5 py-2.5 text-sm font-semibold text-white">Talk to Emmanuel about this</Link>
        </aside>
      )}
    </main>
  );
}
