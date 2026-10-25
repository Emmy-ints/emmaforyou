import type { ReactNode } from "react";

/**
 * Kinetic headline: each word rises through a mask with a short stagger. The words stay real text in
 * reading order (one copy, so screen readers and search engines read the sentence normally), and
 * reduced-motion visitors see it static.
 */
export function KineticText({ text, base = 120, shine }: { text: string; base?: number; shine?: string[] }) {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <span className="kt" style={{ ["--kt-base" as string]: `${base}ms` }}>
      {words.map((w, i) => (
        <span key={i}>
          <span className="kt-w"><span className={shine?.includes(w.replace(/[^\p{L}\p{N}]/gu, "")) ? "kt-shine" : undefined} style={{ ["--kt-i" as string]: i }}>{w}</span></span>
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}

/** Eyebrow label with the cyan signal dot, used across section headers. */
export function SignalLabel({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--emma-violet)]"><span className="h-1.5 w-1.5 rounded-full bg-[var(--emma-cyan)] shadow-[0_0_12px_var(--emma-cyan)]" aria-hidden="true" />{children}</span>;
}

/**
 * Scroll-scrubbed sentence: words light up one by one as the block crosses the viewport (driven by
 * the runtime's --sp). Without the runtime or with reduced motion every word is fully lit.
 */
export function ScrubWords({ text, className = "", accent }: { text: string; className?: string; accent?: string[] }) {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <span className={`scrub ${className}`} data-scroll style={{ ["--n" as string]: words.length }}>
      {words.map((w, i) => (
        <span key={i}><span className={`scrub-w ${accent?.includes(w.replace(/[^\p{L}\p{N}]/gu, "")) ? "scrub-accent" : ""}`} style={{ ["--i" as string]: i }}>{w}</span>{i < words.length - 1 ? " " : ""}</span>
      ))}
    </span>
  );
}
