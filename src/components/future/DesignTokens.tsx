import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { applyTokens, PREVIEW_KEY, type Tokens } from "@/lib/design-tokens";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

/**
 * Applies the owner's published design tokens to every page (one small read, cached for the
 * session). If an admin is previewing a draft from the control room, the draft is applied in their
 * browser only, with a bar to exit the preview.
 */
export default function DesignTokens() {
  const [preview, setPreview] = useState<Tokens | null>(null);
  useEffect(() => {
    let p: Tokens | null = null;
    try { const raw = localStorage.getItem(PREVIEW_KEY); if (raw) p = JSON.parse(raw); } catch { /* storage blocked */ }
    if (p) { setPreview(p); applyTokens(p); return; }
    try { const cached = sessionStorage.getItem("efy_design_live"); if (cached) applyTokens(JSON.parse(cached)); } catch { /* storage blocked */ }
    db.from("site_design").select("published").eq("id", 1).maybeSingle().then(({ data }: { data: { published: Tokens } | null }) => {
      const t = data?.published ?? {};
      applyTokens(t);
      try { sessionStorage.setItem("efy_design_live", JSON.stringify(t)); } catch { /* storage blocked */ }
    }, () => { /* offline: keep the built-in design */ });
  }, []);
  if (!preview) return null;
  return (
    <div className="design-preview-bar" role="status">
      Previewing a draft design (only you can see it).
      <button type="button" onClick={() => { try { localStorage.removeItem(PREVIEW_KEY); sessionStorage.removeItem("efy_design_live"); } catch { /* */ } window.location.reload(); }}>Exit preview</button>
    </div>
  );
}
