import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import StatusScreen from "./StatusScreen";
import { supabase } from "@/integrations/supabase/client";

/**
 * Site-wide 404. Before showing "not found", it checks the owner's live redirects (control room →
 * Redirects) and forwards the visitor if the old address has a new home. Redirects only ever apply
 * to addresses that don't exist, so they can't hide a working page.
 */
export default function NotFoundComponent() {
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    let live = true;
    const path = (window.location.pathname.replace(/\/$/, "") || "/");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).rpc("site_live_redirects").then(({ data }: { data: { from_path: string; to_path: string }[] | null }) => {
      const hit = data?.find((r) => r.from_path === path);
      if (hit && /^\/[^/]/.test(hit.to_path)) { window.location.replace(hit.to_path + (hit.to_path.includes("?") ? "" : window.location.search)); return; }
      if (live) setChecking(false);
    }, () => { if (live) setChecking(false); });
    const t = window.setTimeout(() => { if (live) setChecking(false); }, 1500);
    return () => { live = false; window.clearTimeout(t); };
  }, []);
  return (
    <StatusScreen
      code="404"
      title={checking ? "Looking for this page…" : "This page drifted out of orbit."}
      body={checking ? "Checking whether it has moved." : "The page you're looking for doesn't exist or has moved. Search the site, or head somewhere useful."}
      actions={<>
        <Link to="/" className="btn-primary-gradient inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium">Go home</Link>
        <button type="button" onClick={() => window.dispatchEvent(new Event("efy-open-search"))} className="hero-ghost-btn">Search the site</button>
        <Link to="/services" className="hero-ghost-btn">Our services</Link>
      </>}
    />
  );
}
