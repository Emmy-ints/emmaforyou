import { lazy, Suspense, useEffect, useState } from "react";

const CommandPalette = lazy(() => import("./CommandPalette"));

/** Opens the site search on ⌘K / Ctrl K, on "/" (outside text fields) or on the `efy-open-search` event. Loads on first use. */
export default function SearchLauncher() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = !!t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setOpen((o) => !o); }
      else if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); setOpen(true); }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("efy-open-search", onOpen);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("efy-open-search", onOpen); };
  }, []);
  if (!open) return null;
  return <Suspense fallback={null}><CommandPalette onClose={() => setOpen(false)} /></Suspense>;
}
