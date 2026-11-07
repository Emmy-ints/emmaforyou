import { useId } from "react";

/**
 * The EmmaForYou wordmark: a small monogram tile (an "E" built from three bars, the middle one
 * ending in the signal-cyan dot) beside "Emma" set heavy and "ForYou" set lighter in violet.
 * Pure SVG + text, so it stays crisp at every size and follows light, dark and midnight themes.
 * The founder's portrait (a crop of the real photo, /images/emmanuel.webp) sits on the tile's corner
 * like a signature, so the person behind the studio is part of the mark itself.
 */
export default function Wordmark({ size = "md", className = "", founder = true }: { size?: "sm" | "md"; className?: string; founder?: boolean }) {
  const tile = size === "sm" ? 28 : 32;
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  return (
    <span className={`efy-wordmark inline-flex items-center ${founder ? "gap-[1.15rem]" : "gap-2.5"} ${className}`}>
      <span className={`efy-mark efy-mark-${size}`}>
      <svg width={tile} height={tile} viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
        <defs>
          <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#7d6cff" />
            <stop offset="1" stopColor="#4f5ff0" />
          </linearGradient>
          <linearGradient id={`${id}-sh`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.28" />
            <stop offset="0.5" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="9" fill={`url(#${id}-bg)`} />
        <rect width="32" height="32" rx="9" fill={`url(#${id}-sh)`} />
        <rect x="0.5" y="0.5" width="31" height="31" rx="8.5" fill="none" stroke="#ffffff" strokeOpacity="0.18" />
        <rect x="9" y="8.5" width="14" height="3" rx="1.5" fill="#ffffff" />
        <rect x="9" y="14.5" width="9" height="3" rx="1.5" fill="#ffffff" />
        <circle cx="21.5" cy="16" r="1.9" fill="#3dd6f5" />
        <rect x="9" y="20.5" width="14" height="3" rx="1.5" fill="#ffffff" />
        <rect x="9" y="8.5" width="3" height="15" rx="1.5" fill="#ffffff" />
      </svg>
      {founder && <img src="/images/emmanuel-face-96.webp" width={96} height={96} alt="" aria-hidden="true" decoding="async" className="efy-mark-face" />}
      </span>
      <span className={`efy-wordmark-text font-display leading-none tracking-[-0.03em] ${size === "sm" ? "text-[1.05rem]" : "text-[1.14rem] sm:text-[1.2rem]"}`}>
        <span className="font-bold text-foreground">Emma</span><span className="efy-wordmark-accent font-medium">ForYou</span>
      </span>
    </span>
  );
}
