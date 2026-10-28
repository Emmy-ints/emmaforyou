import { useEffect, useRef } from "react";
import type { Layout, FontKey } from "@/lib/books/layout";
import { SERIF } from "@/lib/books/fonts";

const css = (f: FontKey, size: number) => `${f === "i" || f === "bi" ? "italic " : ""}${f === "b" || f === "bi" ? 700 : 400} ${size}px ${SERIF}, Georgia, serif`;

/** Draws one laid-out page on a canvas with the same fonts and positions the PDF uses. */
export default function PagePreview({ layout, index, cover, width = 360 }: { layout: Layout; index: number; cover?: string | null; width?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const p = layout.pages[index]; if (!p) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const s = width / layout.width;
    c.width = Math.round(width * dpr); c.height = Math.round(layout.height * s * dpr);
    c.style.width = `${width}px`; c.style.height = `${layout.height * s}px`;
    const ctx = c.getContext("2d")!;
    ctx.setTransform(dpr * s, 0, 0, dpr * s, 0, 0);
    ctx.fillStyle = "#fffdf8"; ctx.fillRect(0, 0, layout.width, layout.height);
    const drawText = () => {
      ctx.fillStyle = "#1b1b1f"; ctx.textBaseline = "alphabetic";
      for (const it of p.items) {
        ctx.font = css(it.f, it.s);
        ctx.fillText(it.text, it.x, it.y);
      }
    };
    if (p.image && cover) {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(layout.width / img.width, layout.height / img.height);
        const w = img.width * k, h = img.height * k;
        ctx.drawImage(img, (layout.width - w) / 2, (layout.height - h) / 2, w, h);
        drawText();
      };
      img.src = cover;
    } else drawText();
  }, [layout, index, cover, width]);
  const p = layout.pages[index];
  return <canvas ref={ref} role="img" aria-label={`Page ${index + 1} of ${layout.pages.length}${p?.folio ? ` (printed page number ${p.folio})` : ""}`} className="mx-auto block rounded-md shadow-[0_18px_40px_-22px_rgba(0,0,0,.55)] ring-1 ring-black/10" />;
}
