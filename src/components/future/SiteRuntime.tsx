import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { X } from "lucide-react";
import { isPreviewingSettings, setSettingsPreview, useSetting, useSettings } from "@/lib/site-settings";

function setMeta(name: string, content: string | null) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (content === null) { if (el?.dataset.efyOverride) el.remove(); return; }
  if (!el) { el = document.createElement("meta"); el.name = name; el.dataset.efyOverride = "1"; document.head.appendChild(el); }
  el.content = content;
}

/**
 * Applies the owner's published site settings that affect every page:
 * - Draft SEO overrides while a staff member previews drafts (published ones are server-rendered).
 * - The announcement bar.
 * - The bar shown to staff who are previewing their draft settings.
 */
export default function SiteRuntime() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const settings = useSettings();
  const announce = useSetting("announce");
  const [previewing, setPreviewing] = useState(false);
  // Published SEO overrides are server-rendered by pageHead(); this only shows staff their drafts.
  const seo = previewing ? settings[`seo:${path.replace(/\/$/, "") || "/"}`] : undefined;
  useEffect(() => { setPreviewing(isPreviewingSettings()); }, []);

  useEffect(() => {
    if (!seo) return;
    const prev = { title: document.title, desc: document.querySelector<HTMLMetaElement>('meta[name="description"]')?.content ?? null };
    // Run after the router's own head update for this navigation.
    const t = window.setTimeout(() => {
      if (seo.title) document.title = seo.title;
      if (seo.description) setMeta("description", seo.description);
      if (seo.noindex) setMeta("robots", "noindex, nofollow");
    }, 0);
    return () => { window.clearTimeout(t); if (seo.title) document.title = prev.title; if (seo.description && prev.desc) setMeta("description", prev.desc); };
  }, [path, seo]);

  const show = announce?.on && announce.text;
  return (
    <>
      {show && !path.startsWith("/dashboard") && (
        <div className="site-announce" role="region" aria-label="Announcement">
          {announce.href ? <a href={announce.href}>{announce.text} <span aria-hidden="true">→</span></a> : <span>{announce.text}</span>}
        </div>
      )}
      {previewing && (
        <div className="design-preview-bar" role="status" style={{ bottom: "auto", top: 12 }}>
          Previewing draft site settings (only you can see them).
          <button type="button" onClick={() => { setSettingsPreview(null); window.location.reload(); }}><X className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />Exit preview</button>
        </div>
      )}
    </>
  );
}
