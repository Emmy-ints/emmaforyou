import { useState } from "react";
import type { Project } from "@/lib/portfolio-data";

const HUE: Record<string, string> = { Ecommerce: "#ff8a4c", Websites: "#3dd6f5", Automation: "#8b7bff", "Social Media": "#ff6bb5", Ads: "#3ddc97", Branding: "#f5b544" };

/**
 * Drawn stand-in for a project whose photo can't be shown (missing or failed to load): a browser
 * frame with the project's own name, address and category, in the category colour. Always labelled
 * as an illustrative preview so it's never mistaken for a screenshot.
 */
export default function ProjectVisual({ p, className = "" }: { p: Project; className?: string }) {
  const hue = HUE[p.category] ?? "#8b7bff";
  return (
    <div className={`pv ${className}`} style={{ ["--hue" as string]: hue }} role="img" aria-label={`Illustrative preview of the ${p.name} project (not a screenshot)`}>
      <div className="pv-browser">
        <div className="pv-bar"><i /><i /><i /><span>{p.url}</span></div>
        <div className="pv-page">
          <div className="pv-nav"><b>{p.name}</b><span /><span /><span /></div>
          <div className="pv-hero"><p>{p.desc.split(/[—.]/)[0]}</p><em /></div>
          <div className="pv-tiles"><span /><span /><span /></div>
        </div>
      </div>
      <span className="pv-label">Illustrative preview</span>
    </div>
  );
}

/** A project photo that falls back to the labelled illustrative preview if the photo can't load. */
export function SafeProjectImage({ p, src, alt, className = "" }: { p: Project; src: string; alt: string; className?: string }) {
  const [broken, setBroken] = useState(false);
  if (broken) return <ProjectVisual p={p} className={className} />;
  return <img src={src} alt={alt} loading="lazy" decoding="async" className={className}
    ref={(el) => { if (el?.complete && el.naturalWidth === 0 && el.src) setBroken(true); }} onError={() => setBroken(true)} />;
}
