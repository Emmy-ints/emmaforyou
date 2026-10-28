/**
 * Page layout for the PDF export and the on-screen page preview (both draw the same result).
 * Greedy line breaking with optional justification, orphan/widow control, headings kept with
 * the next lines, chapter openers, title/copyright/dedication/contents pages and page numbers.
 * Coordinates are points from the top-left of the page.
 */
import { type Book, type Block, type Run, PAGE_SIZES } from "./manuscript";
import { type TtfFont, FALLBACKS } from "./ttf";
import { copyrightLines } from "./export-epub";

export type FontKey = "r" | "b" | "i" | "bi";
export interface FontSet { r: TtfFont; b: TtfFont; i: TtfFont; bi: TtfFont }
export interface TextItem { f: FontKey; s: number; x: number; y: number; text: string } // y = baseline
export interface LinkArea { x: number; y: number; w: number; h: number; target: number }
export interface Page {
  kind: "cover" | "title" | "copyright" | "dedication" | "toc" | "body";
  items: TextItem[];
  links: LinkArea[];
  folio: string | null;
  image?: { x: number; y: number; w: number; h: number };
}
export interface Layout {
  width: number; height: number;
  pages: Page[];
  chapterStarts: { title: string; page: number }[]; // page index (0-based)
  missing: string[]; // characters not in the fonts (replaced)
  margins: Margins;
}
export interface Margins { top: number; bottom: number; inner: number; outer: number }

const IN = 72;
/** Inside-margin minimums for print-on-demand paperbacks by page count (KDP, checked 28 Oct 2026). */
export function minGutter(pages: number): number {
  if (pages <= 150) return 0.375 * IN;
  if (pages <= 300) return 0.5 * IN;
  if (pages <= 500) return 0.625 * IN;
  if (pages <= 700) return 0.75 * IN;
  return 0.875 * IN;
}
export function marginsFor(book: Book, pageCount: number): Margins {
  const size = PAGE_SIZES[book.settings.pageSize];
  if (!size.print) return { top: IN, bottom: IN, inner: IN, outer: IN };
  // outside ≥ 0.25 in without bleed; we use 0.5 in for comfort. Inside = minimum + 0.125 in.
  return { top: 0.6 * IN, bottom: 0.7 * IN, inner: minGutter(pageCount) + 0.125 * IN, outer: 0.5 * IN };
}

class Measurer {
  missing = new Set<string>();
  private cache = new Map<string, number>();
  constructor(public fonts: FontSet) {}
  /** Replace characters the font can't draw (NFD decomposition first, then a fallback table). */
  prep(text: string, f: FontKey): string {
    const font = this.fonts[f];
    let out = "";
    for (const ch of text.normalize("NFC")) {
      const cp = ch.codePointAt(0)!;
      if (font.glyphFor(cp) || cp === 0x20) { out += ch; continue; }
      if (cp < 0x20) { out += " "; continue; }
      const d = ch.normalize("NFD");
      if (d !== ch && [...d].every((c) => font.glyphFor(c.codePointAt(0)!))) { out += d; continue; }
      if (ch in FALLBACKS) { out += FALLBACKS[ch]; if (FALLBACKS[ch]) this.missing.add(ch); continue; }
      this.missing.add(ch); out += "?";
    }
    return out;
  }
  width(text: string, f: FontKey, size: number): number {
    const font = this.fonts[f];
    let w = 0;
    for (const ch of text) {
      const k = f + ch;
      let a = this.cache.get(k);
      if (a === undefined) { a = font.advance(font.glyphFor(ch.codePointAt(0)!)) / font.unitsPerEm; this.cache.set(k, a); }
      w += a;
    }
    return w * size;
  }
}

const keyOf = (r: { b?: boolean; i?: boolean }, forceItalic = false, forceBold = false): FontKey => {
  const b = r.b || forceBold, i = r.i || forceItalic;
  return b && i ? "bi" : b ? "b" : i ? "i" : "r";
};

interface Frag { f: FontKey; text: string; w: number }
interface Word { frags: Frag[]; w: number; spaceAfter: number }
interface Line { words: Word[]; natural: number; indent: number; avail: number; last: boolean }

export function layoutBook(book: Book, fonts: FontSet, opts: { cover?: boolean } = {}): Layout {
  // Iterate because the print inside margin depends on the final page count.
  let guess = Math.max(24, Math.round(book.chapters.reduce((a, c) => a + c.blocks.length, 0) / 6));
  let res = layoutOnce(book, fonts, marginsFor(book, guess), opts);
  for (let k = 0; k < 3; k++) {
    const m2 = marginsFor(book, res.pages.length);
    if (m2.inner === res.margins.inner) break;
    guess = res.pages.length;
    res = layoutOnce(book, fonts, m2, opts);
  }
  return res;
}

function layoutOnce(book: Book, fonts: FontSet, margins: Margins, opts: { cover?: boolean }): Layout {
  const { settings, meta } = book;
  const size = PAGE_SIZES[settings.pageSize];
  const W = size.w, H = size.h;
  const M = new Measurer(fonts);
  const fs = settings.fontSize;
  const lead = fs * settings.lineHeight;
  const mirror = settings.mirrorMargins && size.print;
  const pages: Page[] = [];
  const chapterStarts: { title: string; page: number }[] = [];

  const leftOf = (pi: number) => (mirror ? (pi % 2 === 0 ? margins.inner : margins.outer) : margins.inner);
  const textW = W - margins.inner - margins.outer;
  const bottom = H - margins.bottom;
  let page: Page = null as unknown as Page;
  let y = 0;
  const newPage = (kind: Page["kind"]) => { page = { kind, items: [], links: [], folio: null }; pages.push(page); y = margins.top; return page; };
  const X = () => leftOf(pages.length - 1);
  const baseline = (s: number, l: number) => (l - s) / 2 + s * 0.8;

  const words = (runs: Run[], italic = false, bold = false, s = fs): Word[] => {
    const out: Word[] = [];
    let cur: Word | null = null;
    for (const r of runs) {
      const f = keyOf(r, italic, bold);
      const t = M.prep(r.text, f);
      for (const part of t.split(/(\s+)/)) {
        if (!part) continue;
        if (/^\s+$/.test(part)) { if (cur) { cur.spaceAfter = M.width(" ", f, s); out.push(cur); cur = null; } continue; }
        if (!cur) cur = { frags: [], w: 0, spaceAfter: 0 };
        const w = M.width(part, f, s);
        cur.frags.push({ f, text: part, w }); cur.w += w;
      }
    }
    if (cur) out.push(cur);
    return out;
  };

  const breakLines = (ws: Word[], avail: number, firstIndent: number, s: number): Line[] => {
    const lines: Line[] = [];
    let line: Word[] = []; let natural = 0;
    let indent = firstIndent;
    const push = (last: boolean) => { lines.push({ words: line, natural, indent, avail: avail - indent, last }); line = []; natural = 0; indent = 0; };
    const queue = ws.slice();
    while (queue.length) {
      const w = queue.shift()!;
      const room = avail - indent;
      const gap = line.length ? line[line.length - 1].spaceAfter : 0;
      if (natural + gap + w.w <= room + 0.01) { natural += gap + w.w; line.push(w); continue; }
      if (!line.length) {
        // a single word wider than the line: split it by characters
        const [a, b] = splitWord(w, room, s);
        line.push(a); natural = a.w; push(false); if (b) queue.unshift(b);
        continue;
      }
      push(false); queue.unshift(w);
    }
    if (line.length) push(true);
    if (lines.length) lines[lines.length - 1].last = true;
    return lines;
  };
  const splitWord = (w: Word, room: number, s: number): [Word, Word | null] => {
    const a: Word = { frags: [], w: 0, spaceAfter: 0 }; const b: Word = { frags: [], w: 0, spaceAfter: w.spaceAfter };
    let full = false;
    for (const fr of w.frags) {
      if (full) { b.frags.push(fr); b.w += fr.w; continue; }
      let t = "";
      for (const ch of fr.text) {
        const cw = M.width(t + ch, fr.f, s);
        if (a.w + cw > room && (a.w > 0 || t)) { full = true; break; }
        t += ch;
      }
      if (t) { const tw = M.width(t, fr.f, s); a.frags.push({ f: fr.f, text: t, w: tw }); a.w += tw; }
      const rest = fr.text.slice(t.length);
      if (rest) { const rw = M.width(rest, fr.f, s); b.frags.push({ f: fr.f, text: rest, w: rw }); b.w += rw; full = true; }
    }
    return [a, b.frags.length ? b : null];
  };

  const drawLine = (ln: Line, x0: number, s: number, l: number, align: "justify" | "left" | "center") => {
    const by = y + baseline(s, l);
    let x = x0 + ln.indent;
    let extra = 0;
    if (align === "center") x = x0 + (ln.avail + ln.indent - ln.natural) / 2;
    else if (align === "justify" && !ln.last && ln.words.length > 1) {
      extra = (ln.avail - ln.natural) / (ln.words.length - 1);
      if (extra > s * 1.2) extra = 0; // too loose to justify nicely: leave this line ragged
    }
    ln.words.forEach((w, wi) => {
      w.frags.forEach((fr, fi) => {
        const isLastFrag = fi === w.frags.length - 1 && wi < ln.words.length - 1;
        page.items.push({ f: fr.f, s, x, y: by, text: fr.text + (isLastFrag ? " " : "") });
        x += fr.w;
      });
      if (wi < ln.words.length - 1) x += w.spaceAfter + extra;
    });
    y += l;
  };

  /** Lay out a paragraph with page breaks, orphan and widow control. */
  const flow = (lines: Line[], x0: number, s: number, l: number, align: "justify" | "left" | "center", newKind: Page["kind"] = "body") => {
    let i = 0;
    while (i < lines.length) {
      const cap = Math.floor((bottom - y + 0.01) / l);
      const left = lines.length - i;
      const fresh = page.items.length === 0;
      if (!fresh && (cap <= 0 || (i === 0 && cap === 1 && left > 1))) { newPage(newKind); continue; }
      let take = Math.max(1, Math.min(cap, left));
      if (left - take === 1 && take >= 3) take -= 1; // don't leave one line alone at the top of the next page
      for (let k = 0; k < take; k++) drawLine(lines[i + k], X(), s, l, align);
      i += take;
      if (i < lines.length) newPage(newKind);
    }
    void x0;
  };

  // ---------- front matter ----------
  if (opts.cover) { const p = newPage("cover"); p.image = { x: 0, y: 0, w: W, h: H }; }
  {
    newPage("title");
    const tl = breakLines(words([{ text: meta.title }], false, true, fs * 2.3), textW, 0, fs * 2.3);
    y = margins.top + (bottom - margins.top) * 0.22;
    tl.forEach((ln) => drawLine(ln, X(), fs * 2.3, fs * 2.3 * 1.2, "center"));
    if (meta.subtitle) { y += fs; breakLines(words([{ text: meta.subtitle }], true, false, fs * 1.3), textW, 0, fs * 1.3).forEach((ln) => drawLine(ln, X(), fs * 1.3, fs * 1.3 * 1.35, "center")); }
    y = margins.top + (bottom - margins.top) * 0.6;
    breakLines(words([{ text: meta.author }], false, false, fs * 1.4), textW, 0, fs * 1.4).forEach((ln) => drawLine(ln, X(), fs * 1.4, fs * 1.4 * 1.3, "center"));
    if (meta.publisher) { y = bottom - fs * 2; breakLines(words([{ text: meta.publisher }], false, false, fs * 0.9), textW, 0, fs * 0.9).forEach((ln) => drawLine(ln, X(), fs * 0.9, fs * 1.2, "center")); }
  }
  if (settings.includeCopyright) {
    newPage("copyright");
    const s = Math.max(7.5, fs * 0.8), l = s * 1.4;
    const lines = copyrightLines(book).flatMap((t) => [...breakLines(words([{ text: t }], false, false, s), textW, 0, s), null]);
    y = bottom - lines.length * l;
    for (const ln of lines) { if (ln) drawLine(ln, X(), s, l, "left"); else y += l * 0.4; }
  }
  if (meta.dedication?.trim()) {
    newPage("dedication");
    y = margins.top + (bottom - margins.top) * 0.28;
    breakLines(words([{ text: meta.dedication }], true, false, fs), textW * 0.8, 0, fs).forEach((ln) => drawLine(ln, X() + textW * 0.1, fs, lead, "center"));
  }
  // Contents: reserve its pages now, fill numbers after the body is laid out.
  const tocPages: number[] = [];
  const tocEntries: { title: string; lines: Line[] }[] = [];
  const tocS = fs, tocL = fs * 1.6;
  const numW = M.width("0000", "r", tocS);
  if (settings.includeToc && book.chapters.length > 1) {
    newPage("toc"); tocPages.push(pages.length - 1);
    const hs = fs * 1.6;
    y = margins.top + (bottom - margins.top) * 0.08;
    breakLines(words([{ text: "Contents" }], false, true, hs), textW, 0, hs).forEach((ln) => drawLine(ln, X(), hs, hs * 1.6, "center"));
    y += lead;
    for (const c of book.chapters) {
      const lines = breakLines(words([{ text: c.title || "Untitled" }], false, false, tocS), textW - numW - tocS, 0, tocS);
      if (y + lines.length * tocL > bottom) { newPage("toc"); tocPages.push(pages.length - 1); }
      tocEntries.push({ title: c.title, lines: lines.map((ln) => ({ ...ln })) });
      (tocEntries[tocEntries.length - 1] as { at?: { page: number; y: number } }).at = { page: pages.length - 1, y };
      y += lines.length * tocL;
    }
  }

  // ---------- body ----------
  const firstBodyIndex = pages.length;
  let pageIsFresh = false;
  book.chapters.forEach((c, ci) => {
    if (settings.chapterNewPage || ci === 0) { newPage("body"); pageIsFresh = true; }
    else { y += lead * 2; if (y + lead * 6 > bottom) { newPage("body"); } }
    if (pageIsFresh) y = margins.top + (bottom - margins.top) * 0.16;
    pageIsFresh = false;
    chapterStarts.push({ title: c.title, page: pages.length - 1 });
    const hs = fs * 1.75, hl = hs * 1.3;
    breakLines(words([{ text: c.title || `Chapter ${ci + 1}` }], false, true, hs), textW, 0, hs).forEach((ln) => drawLine(ln, X(), hs, hl, "center"));
    y += lead * 1.5;
    let firstPara = true;
    c.blocks.forEach((b: Block, bi) => {
      const next = c.blocks[bi + 1];
      if (b.t === "p") {
        const lines = breakLines(words(b.runs), textW, firstPara ? 0 : fs * 1.5, fs);
        flow(lines, X(), fs, lead, settings.justify ? "justify" : "left");
        firstPara = false;
      } else if (b.t === "h") {
        const s = b.level === 2 ? fs * 1.25 : fs * 1.05, l = s * 1.35;
        y += lead * 0.8;
        const lines = breakLines(words(b.runs, b.level === 3, true, s), textW, 0, s);
        if (y + lines.length * l + lead * 2 > bottom && next) newPage("body");
        flow(lines, X(), s, l, "left");
        y += lead * 0.3;
        firstPara = true;
      } else if (b.t === "quote") {
        y += lead * 0.4;
        const ind = fs * 2;
        const lines = breakLines(words(b.runs, true), textW - ind * 2, 0, fs).map((ln) => ({ ...ln, indent: ln.indent + ind }));
        // indent is applied inside drawLine via x0 + indent; avail already excludes both sides
        flow(lines, X(), fs, lead, settings.justify ? "justify" : "left");
        y += lead * 0.4;
      } else if (b.t === "list") {
        y += lead * 0.3;
        const ind = fs * 2.2;
        b.items.forEach((it, k) => {
          const lines = breakLines(words(it), textW - ind, 0, fs).map((ln) => ({ ...ln, indent: ln.indent + ind }));
          if (y + lead > bottom) newPage("body");
          const marker = b.ordered ? `${k + 1}.` : "•";
          page.items.push({ f: "r", s: fs, x: X() + ind - fs * 0.6 - M.width(marker, "r", fs), y: y + baseline(fs, lead), text: marker });
          flow(lines, X(), fs, lead, "left");
        });
        y += lead * 0.3;
      } else {
        if (y + lead * 2 > bottom) newPage("body");
        else {
          y += lead * 0.3;
          const t = "*   *   *";
          page.items.push({ f: "r", s: fs, x: X() + (textW - M.width(t, "r", fs)) / 2, y: y + baseline(fs, lead), text: t });
          y += lead * 1.3;
        }
        firstPara = true;
      }
    });
  });

  // ---------- page numbers + contents numbers/links ----------
  for (let p = firstBodyIndex; p < pages.length; p++) {
    const n = String(p - firstBodyIndex + 1);
    pages[p].folio = n;
    const s = Math.max(7.5, fs * 0.85);
    pages[p].items.push({ f: "r", s, x: leftOf(p) + (textW - M.width(n, "r", s)) / 2, y: H - margins.bottom / 2 + s * 0.3, text: n });
  }
  tocEntries.forEach((e, k) => {
    const at = (e as { at?: { page: number; y: number } }).at!;
    const target = chapterStarts[k].page;
    const num = String(target - firstBodyIndex + 1);
    const pg = pages[at.page];
    const x0 = leftOf(at.page);
    let ly = at.y;
    e.lines.forEach((ln, li) => {
      const by = ly + baseline(tocS, tocL);
      let x = x0;
      ln.words.forEach((w, wi) => { w.frags.forEach((fr, fi) => { pg.items.push({ f: fr.f, s: tocS, x, y: by, text: fr.text + (fi === w.frags.length - 1 && wi < ln.words.length - 1 ? " " : "") }); x += fr.w; }); x += w.spaceAfter; });
      if (li === e.lines.length - 1) {
        const nw = M.width(num, "r", tocS);
        const nx = x0 + textW - nw;
        // dot leaders between title and number
        const dot = M.width(" .", "r", tocS);
        let dx = x + tocS * 0.5;
        let dots = "";
        while (dx + dot < nx - tocS * 0.4) { dots += " ."; dx += dot; }
        if (dots) pg.items.push({ f: "r", s: tocS, x: nx - tocS * 0.4 - M.width(dots, "r", tocS), y: by, text: dots });
        pg.items.push({ f: "r", s: tocS, x: nx, y: by, text: num });
      }
      ly += tocL;
    });
    pg.links.push({ x: x0, y: at.y, w: textW, h: e.lines.length * tocL, target });
  });

  return { width: W, height: H, pages, chapterStarts, missing: [...M.missing], margins };
}
