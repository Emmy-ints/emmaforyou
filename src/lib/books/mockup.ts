/**
 * Mockups and promo graphics rendered on a canvas from the author's own cover image:
 * perspective 3D eBook and paperback, tablet and phone shots, and social/banner/quote formats.
 */
import { SANS, SERIF } from "./fonts";
import { fitText } from "./cover";

export type Img = CanvasImageSource & { width: number; height: number };
type Ctx = CanvasRenderingContext2D;

export interface PromoText { headline: string; sub: string; cta: string; quote: string; attribution: string; badge: string }
export interface PromoStyle { bg1: string; bg2: string; fg: string; accent: string }

export interface Format { id: string; name: string; w: number; h: number; use: string }
export const FORMATS: Format[] = [
  { id: "ebook3d", name: "3D eBook", w: 1600, h: 1200, use: "Website, media kit, ads" },
  { id: "paperback", name: "3D paperback", w: 1600, h: 1200, use: "Website, pre-orders" },
  { id: "tablet", name: "Book on a tablet", w: 1600, h: 1200, use: "Website, email" },
  { id: "phone", name: "Book on a phone", w: 1080, h: 1350, use: "Instagram / Facebook feed" },
  { id: "square", name: "Launch post (square)", w: 1080, h: 1080, use: "Instagram, Facebook, LinkedIn" },
  { id: "portrait", name: "Launch post (portrait)", w: 1080, h: 1350, use: "Instagram / Facebook feed" },
  { id: "story", name: "Story / Reel cover", w: 1080, h: 1920, use: "Instagram & Facebook Stories, TikTok" },
  { id: "banner", name: "Header banner", w: 1500, h: 500, use: "X / Twitter header, website strip" },
  { id: "link", name: "Link preview / ad", w: 1200, h: 628, use: "Facebook link, website og:image, ads" },
  { id: "quote", name: "Quote card", w: 1080, h: 1080, use: "Social posts" },
  { id: "announce", name: "Announcement", w: 1080, h: 1080, use: "Out now / coming soon" },
];

function bg(ctx: Ctx, w: number, h: number, st: PromoStyle) {
  const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, st.bg1); g.addColorStop(1, st.bg2);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  const r = ctx.createRadialGradient(w * 0.75, h * 0.2, 0, w * 0.75, h * 0.2, Math.max(w, h) * 0.6);
  r.addColorStop(0, `${st.accent}40`); r.addColorStop(1, `${st.accent}00`); ctx.fillStyle = r; ctx.fillRect(0, 0, w, h);
}

/** Draw `img` into the quadrilateral tl,tr,br,bl (left/right edges vertical) using thin vertical strips. */
function warp(ctx: Ctx, img: Img, x0: number, top0: number, bot0: number, x1: number, top1: number, bot1: number, strips = 120) {
  const sw = img.width / strips;
  for (let i = 0; i < strips; i++) {
    const t = i / strips, t2 = (i + 1) / strips;
    const dx = x0 + (x1 - x0) * t, dx2 = x0 + (x1 - x0) * t2;
    const top = top0 + (top1 - top0) * t, bot = bot0 + (bot1 - bot0) * t;
    ctx.drawImage(img, i * sw, 0, sw + 0.6, img.height, dx, top, dx2 - dx + 0.8, bot - top);
  }
}

/** A book standing at an angle: front cover in perspective, spine and (for paperbacks) page edges. */
export function book3d(ctx: Ctx, img: Img, cx: number, cy: number, h: number, opts: { thick: number; pages: boolean; turn?: number }) {
  const w = h * (img.width / img.height);
  const turn = opts.turn ?? 0.32; // 0 = flat, 1 = edge-on
  const fw = w * (1 - turn * 0.45), dz = h * 0.035 * (turn / 0.32);
  const spineW = opts.thick * (0.55 + turn);
  const left = cx - (fw + spineW) / 2 + spineW;
  const top = cy - h / 2, bot = cy + h / 2;
  // shadow
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.filter = `blur(${Math.round(h * 0.03)}px)`;
  ctx.beginPath(); ctx.ellipse(cx + fw * 0.08, bot + h * 0.02, (fw + spineW) * 0.58, h * 0.035, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  // spine (left), darkened slice of the cover's left edge
  const s0 = left - spineW;
  ctx.save();
  ctx.beginPath(); ctx.moveTo(s0, top + dz * 0.6); ctx.lineTo(left, top); ctx.lineTo(left, bot); ctx.lineTo(s0, bot - dz * 0.6); ctx.closePath(); ctx.clip();
  warp(ctx, img, s0, top + dz * 0.6, bot - dz * 0.6, left, top, bot, 8);
  ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.fillRect(s0, top, spineW, h);
  ctx.restore();
  // pages (right edge, paperback)
  if (opts.pages) {
    const pr = left + fw, pw = opts.thick * 0.5;
    ctx.save();
    ctx.beginPath(); ctx.moveTo(pr, top + dz); ctx.lineTo(pr + pw, top + dz + pw * 0.3); ctx.lineTo(pr + pw, bot - dz - pw * 0.3); ctx.lineTo(pr, bot - dz); ctx.closePath();
    const pg = ctx.createLinearGradient(pr, 0, pr + pw, 0); pg.addColorStop(0, "#e9e4d8"); pg.addColorStop(1, "#fbf8f1"); ctx.fillStyle = pg; ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,.06)"; ctx.lineWidth = 1;
    for (let y = top + dz + 3; y < bot - dz; y += 3) { ctx.beginPath(); ctx.moveTo(pr, y); ctx.lineTo(pr + pw, y + 0.5); ctx.stroke(); }
    ctx.restore();
  }
  // front cover
  warp(ctx, img, left, top, bot, left + fw, top + dz, bot - dz);
  // light: hinge shadow and a soft sheen
  const g = ctx.createLinearGradient(left, 0, left + fw, 0);
  g.addColorStop(0, "rgba(0,0,0,.28)"); g.addColorStop(0.04, "rgba(255,255,255,.12)"); g.addColorStop(0.08, "rgba(0,0,0,0)"); g.addColorStop(0.7, "rgba(255,255,255,.06)"); g.addColorStop(1, "rgba(0,0,0,.12)");
  ctx.save(); ctx.beginPath(); ctx.moveTo(left, top); ctx.lineTo(left + fw, top + dz); ctx.lineTo(left + fw, bot - dz); ctx.lineTo(left, bot); ctx.closePath(); ctx.clip(); ctx.fillStyle = g; ctx.fillRect(left, top, fw, h); ctx.restore();
}

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

function device(ctx: Ctx, img: Img, x: number, y: number, w: number, h: number, radius: number, bezel: number, notch: boolean) {
  ctx.save(); ctx.shadowColor = "rgba(0,0,0,.45)"; ctx.shadowBlur = w * 0.08; ctx.shadowOffsetY = w * 0.03;
  roundRect(ctx, x, y, w, h, radius); ctx.fillStyle = "#121423"; ctx.fill(); ctx.restore();
  roundRect(ctx, x + 2, y + 2, w - 4, h - 4, radius - 2); ctx.strokeStyle = "#2b2e45"; ctx.lineWidth = 3; ctx.stroke();
  const sx = x + bezel, sy = y + bezel, sw = w - 2 * bezel, sh = h - 2 * bezel;
  ctx.save(); roundRect(ctx, sx, sy, sw, sh, Math.max(4, radius - bezel)); ctx.clip();
  ctx.fillStyle = "#0d0d14"; ctx.fillRect(sx, sy, sw, sh);
  const k = Math.min(sw / img.width, sh / img.height) * 0.94;
  ctx.drawImage(img, sx + (sw - img.width * k) / 2, sy + (sh - img.height * k) / 2, img.width * k, img.height * k);
  ctx.restore();
  if (notch) { roundRect(ctx, x + w / 2 - w * 0.14, y + bezel * 0.6, w * 0.28, bezel * 0.9, bezel * 0.45); ctx.fillStyle = "#121423"; ctx.fill(); }
}

function text(ctx: Ctx, s: string, x: number, y: number, maxW: number, px: number, opts: { weight?: number; serif?: boolean; italic?: boolean; color: string; align?: CanvasTextAlign; lines?: number; lh?: number }) {
  if (!s.trim()) return y;
  const f = (p: number) => `${opts.italic ? "italic " : ""}${opts.weight ?? 700} ${Math.round(p)}px ${opts.serif ? `${SERIF}, Georgia, serif` : `${SANS}, Arial, sans-serif`}`;
  const r = fitText(ctx, s, f, maxW, px, opts.lines ?? 3, px * 0.4);
  ctx.font = f(r.px); ctx.fillStyle = opts.color; ctx.textAlign = opts.align ?? "left"; ctx.textBaseline = "alphabetic";
  const lh = r.px * (opts.lh ?? 1.15);
  r.lines.forEach((l, i) => ctx.fillText(l, x, y + r.px + i * lh));
  return y + r.px + (r.lines.length - 1) * lh + r.px * 0.35;
}

function pill(ctx: Ctx, s: string, x: number, y: number, px: number, st: PromoStyle, align: "left" | "center" = "left") {
  if (!s.trim()) return y;
  ctx.font = `700 ${Math.round(px)}px ${SANS}, Arial, sans-serif`;
  const w = ctx.measureText(s).width + px * 1.6, h = px * 2;
  const xx = align === "center" ? x - w / 2 : x;
  roundRect(ctx, xx, y, w, h, h / 2); ctx.fillStyle = st.accent; ctx.fill();
  ctx.fillStyle = contrast(st.accent); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(s, xx + w / 2, y + h / 2 + 1);
  ctx.textBaseline = "alphabetic";
  return y + h;
}
function contrast(hex: string) { const n = parseInt(hex.slice(1), 16); const L = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; return L > 0.6 ? "#14121f" : "#ffffff"; }

export function renderFormat(ctx: Ctx, f: Format, img: Img, t: PromoText, st: PromoStyle) {
  const { w, h } = f;
  ctx.clearRect(0, 0, w, h);
  bg(ctx, w, h, st);
  switch (f.id) {
    case "ebook3d": book3d(ctx, img, w / 2, h / 2, h * 0.74, { thick: h * 0.03, pages: false, turn: 0.32 }); break;
    case "paperback": book3d(ctx, img, w / 2, h / 2, h * 0.72, { thick: h * 0.07, pages: true, turn: 0.4 }); break;
    case "tablet": { const dh = h * 0.8, dw = dh * 0.74; device(ctx, img, (w - dw) / 2, (h - dh) / 2, dw, dh, dw * 0.06, dw * 0.05, false); break; }
    case "phone": { const dh = h * 0.78, dw = dh * 0.48; device(ctx, img, (w - dw) / 2, h * 0.16, dw, dh, dw * 0.12, dw * 0.04, true); text(ctx, t.headline, w / 2, h * 0.03, w * 0.86, h * 0.055, { color: st.fg, align: "center", lines: 2 }); break; }
    case "square": case "portrait": {
      const yb = h * 0.55;
      book3d(ctx, img, w * 0.5, yb, h * (f.id === "square" ? 0.5 : 0.48), { thick: h * 0.03, pages: true, turn: 0.32 });
      let y = text(ctx, t.headline, w / 2, h * 0.05, w * 0.86, w * 0.07, { color: st.fg, align: "center", lines: 2 });
      text(ctx, t.sub, w / 2, y, w * 0.8, w * 0.035, { weight: 400, color: st.fg, align: "center", lines: 2 });
      pill(ctx, t.cta, w / 2, h * 0.88, w * 0.03, st, "center");
      break;
    }
    case "story": {
      let y = text(ctx, t.badge || t.headline, w / 2, h * 0.08, w * 0.84, w * 0.085, { color: st.fg, align: "center", lines: 3 });
      text(ctx, t.sub, w / 2, y + h * 0.01, w * 0.8, w * 0.04, { weight: 400, color: st.fg, align: "center", lines: 3 });
      book3d(ctx, img, w / 2, h * 0.56, h * 0.42, { thick: h * 0.02, pages: true, turn: 0.32 });
      pill(ctx, t.cta, w / 2, h * 0.86, w * 0.04, st, "center");
      break;
    }
    case "banner": case "link": {
      book3d(ctx, img, w * 0.2, h * 0.52, h * 0.8, { thick: h * 0.04, pages: true, turn: 0.32 });
      const x = w * 0.4, mw = w * 0.55;
      let y = text(ctx, t.headline, x, h * (f.id === "banner" ? 0.2 : 0.18), mw, h * 0.13, { color: st.fg, lines: 2 });
      y = text(ctx, t.sub, x, y, mw, h * 0.055, { weight: 400, color: st.fg, lines: 2 });
      pill(ctx, t.cta, x, y + h * 0.05, h * 0.045, st);
      break;
    }
    case "quote": {
      ctx.fillStyle = `${st.accent}`; ctx.font = `700 ${Math.round(w * 0.3)}px ${SERIF}, Georgia, serif`; ctx.textAlign = "left"; ctx.fillText("“", w * 0.07, w * 0.3);
      const y = text(ctx, t.quote || "Add a short line from your book.", w * 0.1, w * 0.24, w * 0.8, w * 0.06, { weight: 400, italic: true, serif: true, color: st.fg, lines: 7, lh: 1.3 });
      text(ctx, t.attribution ? `— ${t.attribution}` : "", w * 0.1, y + w * 0.02, w * 0.6, w * 0.032, { weight: 600, color: st.fg, lines: 1 });
      const ch = h * 0.26, cw = ch * (img.width / img.height);
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,.4)"; ctx.shadowBlur = 24; ctx.drawImage(img, w - cw - w * 0.07, h - ch - w * 0.07, cw, ch); ctx.restore();
      break;
    }
    case "announce": {
      const y = pill(ctx, t.badge || "OUT NOW", w / 2, h * 0.07, w * 0.035, st, "center");
      book3d(ctx, img, w / 2, h * 0.5, h * 0.48, { thick: h * 0.03, pages: true, turn: 0.32 });
      const y2 = text(ctx, t.headline, w / 2, h * 0.76, w * 0.86, w * 0.06, { color: st.fg, align: "center", lines: 2 });
      text(ctx, t.cta, w / 2, Math.max(y2, y), w * 0.8, w * 0.034, { weight: 400, color: st.fg, align: "center", lines: 1 });
      break;
    }
  }
}
