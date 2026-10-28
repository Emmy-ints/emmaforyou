/**
 * PDF export from the shared page layout. Real PDF 1.7: embedded TrueType fonts (CIDFontType2,
 * Identity-H) with ToUnicode maps so text can be searched and copied, compressed content
 * streams, clickable contents entries, bookmarks (outline) per chapter, document metadata and
 * an optional cover image (JPEG) as the first page for screen/eBook PDFs.
 */
import { type Book } from "./manuscript";
import { type FontKey, type FontSet, type Layout, layoutBook } from "./layout";
import { deflateZlib, concat } from "./zip";
import type { TtfFont } from "./ttf";

const enc = new TextEncoder();
const latin1 = (s: string) => { const b = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i) & 0xff; return b; };
const num = (n: number) => (Math.round(n * 1000) / 1000).toString();
function pdfText(s: string): string {
  // UTF-16BE hex string with BOM (works for any language in Info/Outline)
  let h = "FEFF";
  for (const ch of s) {
    const cp = ch.codePointAt(0)!;
    if (cp > 0xffff) { const v = cp - 0x10000; h += ((0xd800 + (v >> 10)).toString(16).padStart(4, "0") + (0xdc00 + (v & 0x3ff)).toString(16).padStart(4, "0")); }
    else h += cp.toString(16).padStart(4, "0");
  }
  return `<${h.toUpperCase()}>`;
}

export interface PdfOptions { cover?: { jpeg: Uint8Array; width: number; height: number }; now?: Date }
export interface PdfResult { bytes: Uint8Array; pages: number; missing: string[]; layout: Layout }

export async function exportPdf(book: Book, fonts: FontSet, opts: PdfOptions = {}): Promise<PdfResult> {
  const layout = layoutBook(book, fonts, { cover: !!opts.cover });
  const bytes = await writePdf(book, fonts, layout, opts);
  return { bytes, pages: layout.pages.length, missing: layout.missing, layout };
}

export function jpegSize(b: Uint8Array): { width: number; height: number } | null {
  if (b[0] !== 0xff || b[1] !== 0xd8) return null;
  let p = 2;
  while (p < b.length) {
    if (b[p] !== 0xff) return null;
    const m = b[p + 1];
    const len = (b[p + 2] << 8) | b[p + 3];
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { height: (b[p + 5] << 8) | b[p + 6], width: (b[p + 7] << 8) | b[p + 8] };
    p += 2 + len;
  }
  return null;
}

async function writePdf(book: Book, fonts: FontSet, L: Layout, opts: PdfOptions): Promise<Uint8Array> {
  const objs: (Uint8Array | null)[] = [null]; // 1-based
  const alloc = () => { objs.push(null); return objs.length - 1; };
  const set = (id: number, body: string | Uint8Array) => { objs[id] = typeof body === "string" ? latin1(body) : body; };
  const stream = async (dict: string, data: Uint8Array, compress = true) => {
    const d = compress ? await deflateZlib(data) : data;
    return concat([latin1(`<< ${dict}${compress ? " /Filter /FlateDecode" : ""} /Length ${d.length} >>\nstream\n`), d, latin1("\nendstream")]);
  };

  const catalog = alloc(), pagesId = alloc(), info = alloc();
  // ---- fonts: only those used ----
  const used = new Map<FontKey, Map<number, string>>(); // gid → unicode text
  const toGlyphs = (f: FontKey, text: string): string => {
    const font = fonts[f];
    let m = used.get(f); if (!m) { m = new Map(); used.set(f, m); }
    let hex = "";
    for (const ch of text) {
      const g = font.glyphFor(ch.codePointAt(0)!);
      if (!m.has(g)) m.set(g, ch);
      hex += g.toString(16).padStart(4, "0");
    }
    return hex;
  };

  // ---- page content ----
  const pageIds: number[] = L.pages.map(() => alloc());
  const contents: { id: number; data: Uint8Array }[] = [];
  const fontRes = new Map<FontKey, string>([["r", "F1"], ["b", "F2"], ["i", "F3"], ["bi", "F4"]]);
  let coverImg: number | null = null;
  for (let pi = 0; pi < L.pages.length; pi++) {
    const p = L.pages[pi];
    const ops: string[] = [];
    if (p.image && opts.cover) {
      coverImg ??= alloc();
      // fit cover inside page, centred, keeping aspect ratio
      const s = Math.min(L.width / opts.cover.width, L.height / opts.cover.height);
      const w = opts.cover.width * s, h = opts.cover.height * s;
      ops.push(`q ${num(w)} 0 0 ${num(h)} ${num((L.width - w) / 2)} ${num((L.height - h) / 2)} cm /Im1 Do Q`);
    }
    // group consecutive items on the same baseline + font into one text run
    let i = 0;
    ops.push("BT");
    while (i < p.items.length) {
      const a = p.items[i];
      const run = new TjBuilder(fonts[a.f], a.s, (t) => toGlyphs(a.f, t));
      run.text(a.text);
      let end = a.x + width(fonts[a.f], a.text, a.s);
      let j = i + 1;
      while (j < p.items.length) {
        const b = p.items[j];
        if (b.f !== a.f || b.s !== a.s || Math.abs(b.y - a.y) > 0.01 || b.x < end - 0.5) break;
        const gap = b.x - end;
        if (Math.abs(gap) > 0.001) run.shift((-gap * 1000) / a.s);
        run.text(b.text);
        end = b.x + width(fonts[b.f], b.text, b.s);
        j++;
      }
      ops.push(`/${fontRes.get(a.f)} ${num(a.s)} Tf 1 0 0 1 ${num(a.x)} ${num(L.height - a.y)} Tm ${run.done()}`);
      i = j;
    }
    ops.push("ET");
    const id = alloc();
    contents.push({ id, data: enc.encode(ops.join("\n")) });
  }

  // fonts
  const fontIds = new Map<FontKey, number>();
  for (const [f, glyphs] of used) fontIds.set(f, await embedFont(fonts[f], glyphs, alloc, set, stream));

  const fontDict = [...fontIds].map(([f, id]) => `/${fontRes.get(f)} ${id} 0 R`).join(" ");
  const resources = `<< /Font << ${fontDict} >>${coverImg ? ` /XObject << /Im1 ${coverImg} 0 R >>` : ""} /ProcSet [/PDF /Text /ImageC] >>`;
  for (const c of contents) set(c.id, await stream("", c.data));
  if (coverImg && opts.cover) set(coverImg, await stream(`/Type /XObject /Subtype /Image /Width ${opts.cover.width} /Height ${opts.cover.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode`, opts.cover.jpeg, false));

  // pages + link annotations
  L.pages.forEach((p, pi) => {
    const annots = p.links.map((ln) => {
      const id = alloc();
      set(id, `<< /Type /Annot /Subtype /Link /Rect [${num(ln.x)} ${num(L.height - ln.y - ln.h)} ${num(ln.x + ln.w)} ${num(L.height - ln.y)}] /Border [0 0 0] /Dest [${pageIds[ln.target]} 0 R /XYZ null null null] >>`);
      return `${id} 0 R`;
    });
    set(pageIds[pi], `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${num(L.width)} ${num(L.height)}] /Resources ${resources} /Contents ${contents[pi].id} 0 R${annots.length ? ` /Annots [${annots.join(" ")}]` : ""} >>`);
  });
  set(pagesId, `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`);

  // outline (bookmarks)
  let outlines = 0;
  if (L.chapterStarts.length) {
    outlines = alloc();
    const ids = L.chapterStarts.map(() => alloc());
    L.chapterStarts.forEach((c, k) => set(ids[k], `<< /Title ${pdfText(c.title || `Chapter ${k + 1}`)} /Parent ${outlines} 0 R${k > 0 ? ` /Prev ${ids[k - 1]} 0 R` : ""}${k < ids.length - 1 ? ` /Next ${ids[k + 1]} 0 R` : ""} /Dest [${pageIds[c.page]} 0 R /XYZ null null null] >>`));
    set(outlines, `<< /Type /Outlines /First ${ids[0]} 0 R /Last ${ids[ids.length - 1]} 0 R /Count ${ids.length} >>`);
  }
  const lang = book.meta.language || "en";
  set(catalog, `<< /Type /Catalog /Pages ${pagesId} 0 R${outlines ? ` /Outlines ${outlines} 0 R /PageMode /UseOutlines` : ""} /Lang ${pdfText(lang)} /ViewerPreferences << /DisplayDocTitle true >> >>`);
  const d = opts.now ?? new Date();
  const pd = `D:${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}${String(d.getUTCHours()).padStart(2, "0")}${String(d.getUTCMinutes()).padStart(2, "0")}${String(d.getUTCSeconds()).padStart(2, "0")}Z`;
  set(info, `<< /Title ${pdfText(book.meta.title)} /Author ${pdfText(book.meta.author)}${book.meta.subtitle ? ` /Subject ${pdfText(book.meta.subtitle)}` : ""} /Creator ${pdfText("EmmaForYou eBook Creator")} /Producer ${pdfText("EmmaForYou PDF writer")} /CreationDate (${pd}) /ModDate (${pd}) >>`);

  // assemble with xref
  const head = concat([latin1("%PDF-1.7\n%"), new Uint8Array([0xe2, 0xe3, 0xcf, 0xd3]), latin1("\n")]);
  const parts: Uint8Array[] = [head];
  const offsets: number[] = [0];
  let off = head.length;
  for (let id = 1; id < objs.length; id++) {
    const body = objs[id] ?? latin1("null");
    const chunk = concat([latin1(`${id} 0 obj\n`), body, latin1("\nendobj\n")]);
    offsets[id] = off; parts.push(chunk); off += chunk.length;
  }
  const xref = [`xref\n0 ${objs.length}\n0000000000 65535 f \n`, ...offsets.slice(1).map((o) => `${String(o).padStart(10, "0")} 00000 n \n`)].join("");
  const fileId = [...crypto.getRandomValues(new Uint8Array(16))].map((b) => b.toString(16).padStart(2, "0")).join("");
  parts.push(latin1(`${xref}trailer\n<< /Size ${objs.length} /Root ${catalog} 0 R /Info ${info} 0 R /ID [<${fileId}> <${fileId}>] >>\nstartxref\n${off}\n%%EOF\n`));
  return concat(parts);
}

const MARK = /\p{M}/u;
/**
 * Builds TJ arrays. Combining marks (e.g. Yoruba tone marks over ẹ/ọ) have zero advance in the
 * font and rely on OpenType positioning, which PDF doesn't do — so each mark is shifted to sit
 * centred over its base letter, and raised (Ts) above capitals and tall letters.
 */
class TjBuilder {
  private out: string[] = [];
  private cur: string[] = [];
  private base: { gid: number; adv: number } | null = null;
  constructor(private font: TtfFont, private size: number, private hex: (t: string) => string) {}
  shift(n: number) { this.cur.push(num(n)); }
  text(t: string) {
    const f = this.font, k = 1000 / f.unitsPerEm;
    let plain = "";
    const flush = () => { if (plain) { this.cur.push(`<${this.hex(plain)}>`); plain = ""; } };
    for (const ch of t) {
      const gid = f.glyphFor(ch.codePointAt(0)!);
      const adv = f.advance(gid);
      if (MARK.test(ch) && adv === 0 && this.base) {
        const mb = f.bounds(gid), bb = f.bounds(this.base.gid);
        if (mb) {
          const baseCenter = bb ? (bb[0] + bb[2]) / 2 : this.base.adv / 2;
          const dx = -(this.base.adv - baseCenter) - (mb[0] + mb[2]) / 2; // font units, from the base's end
          const above = mb[1] >= 0;
          const rise = above && bb && bb[3] > f.xHeight + 40 ? bb[3] - f.xHeight : 0;
          flush();
          if (rise) {
            // Raised above a capital/tall letter with text rise. (Some text extractors then see a small
            // gap after the letter; the printed result is what matters for the book.)
            this.close();
            this.out.push(`${num((rise / f.unitsPerEm) * this.size)} Ts [${num(-dx * k)} <${this.hex(ch)}> ${num(dx * k)}] TJ 0 Ts`);
          } else this.cur.push(num(-dx * k), `<${this.hex(ch)}>`, num(dx * k));
          continue;
        }
      }
      plain += ch;
      if (adv > 0) this.base = { gid, adv };
    }
    flush();
  }
  private close() { if (this.cur.length) { this.out.push(`[${this.cur.join(" ")}] TJ`); this.cur = []; } }
  done() { this.close(); return this.out.join(" "); }
}

function width(font: TtfFont, text: string, size: number) {
  let w = 0;
  for (const ch of text) w += font.advance(font.glyphFor(ch.codePointAt(0)!));
  return (w / font.unitsPerEm) * size;
}

async function embedFont(
  font: TtfFont, glyphs: Map<number, string>, alloc: () => number,
  set: (id: number, b: string | Uint8Array) => void,
  stream: (d: string, b: Uint8Array, c?: boolean) => Promise<Uint8Array>,
): Promise<number> {
  const k = 1000 / font.unitsPerEm;
  const type0 = alloc(), cid = alloc(), desc = alloc(), file = alloc(), tou = alloc();
  const base = font.name.replace(/[^A-Za-z0-9-]/g, "");
  set(file, await stream(`/Length1 ${font.bytes.length}`, font.bytes));
  set(desc, `<< /Type /FontDescriptor /FontName /${base} /Flags ${font.flags} /FontBBox [${font.bbox.map((v) => Math.round(v * k)).join(" ")}] /ItalicAngle ${num(font.italicAngle)} /Ascent ${Math.round(font.ascent * k)} /Descent ${Math.round(font.descent * k)} /CapHeight ${Math.round(font.capHeight * k)} /StemV 80 /FontFile2 ${file} 0 R >>`);
  const gids = [...glyphs.keys()].sort((a, b) => a - b);
  const W = gids.map((g) => `${g} [${Math.round(font.advance(g) * k)}]`).join(" ");
  set(cid, `<< /Type /Font /Subtype /CIDFontType2 /BaseFont /${base} /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /FontDescriptor ${desc} 0 R /DW 500 /W [${W}] /CIDToGIDMap /Identity >>`);
  // ToUnicode
  const hex4 = (n: number) => n.toString(16).padStart(4, "0").toUpperCase();
  const utf16 = (s: string) => [...s].map((c) => { const cp = c.codePointAt(0)!; if (cp <= 0xffff) return hex4(cp); const v = cp - 0x10000; return hex4(0xd800 + (v >> 10)) + hex4(0xdc00 + (v & 0x3ff)); }).join("");
  const lines: string[] = [];
  for (let i = 0; i < gids.length; i += 100) {
    const chunk = gids.slice(i, i + 100);
    lines.push(`${chunk.length} beginbfchar`, ...chunk.map((g) => `<${hex4(g)}> <${utf16(glyphs.get(g)!)}>`), "endbfchar");
  }
  const cmap = `/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /Adobe-Identity-UCS def\n/CMapType 2 def\n1 begincodespacerange\n<0000> <FFFF>\nendcodespacerange\n${lines.join("\n")}\nendcmap\nCMapName currentdict /CMap defineresource pop\nend\nend`;
  set(tou, await stream("", enc.encode(cmap)));
  set(type0, `<< /Type /Font /Subtype /Type0 /BaseFont /${base} /Encoding /Identity-H /DescendantFonts [${cid} 0 R] /ToUnicode ${tou} 0 R >>`);
  return type0;
}

/** A one-page PDF holding a JPEG at an exact physical size (used for the paperback cover wrap proof). */
export function jpegToPdf(jpeg: Uint8Array, px: { w: number; h: number }, sizeIn: { w: number; h: number }, title: string): Uint8Array {
  const W = sizeIn.w * 72, H = sizeIn.h * 72;
  const content = latin1(`q ${num(W)} 0 0 ${num(H)} 0 0 cm /Im1 Do Q`);
  const objs: Uint8Array[] = [
    latin1(`<< /Type /Catalog /Pages 2 0 R >>`),
    latin1(`<< /Type /Pages /Kids [3 0 R] /Count 1 >>`),
    latin1(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${num(W)} ${num(H)}] /TrimBox [9 9 ${num(W - 9)} ${num(H - 9)}] /Resources << /XObject << /Im1 4 0 R >> >> /Contents 5 0 R >>`),
    concat([latin1(`<< /Type /XObject /Subtype /Image /Width ${px.w} /Height ${px.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`), jpeg, latin1("\nendstream")]),
    concat([latin1(`<< /Length ${content.length} >>\nstream\n`), content, latin1("\nendstream")]),
    latin1(`<< /Title ${pdfText(title)} /Producer ${pdfText("EmmaForYou Cover Designer")} >>`),
  ];
  const head = concat([latin1("%PDF-1.7\n%"), new Uint8Array([0xe2, 0xe3, 0xcf, 0xd3]), latin1("\n")]);
  const parts: Uint8Array[] = [head]; const offs: number[] = []; let off = head.length;
  objs.forEach((o, i) => { const c = concat([latin1(`${i + 1} 0 obj\n`), o, latin1("\nendobj\n")]); offs.push(off); parts.push(c); off += c.length; });
  const xref = `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offs.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}`;
  parts.push(latin1(`${xref}trailer\n<< /Size ${objs.length + 1} /Root 1 0 R /Info 6 0 R >>\nstartxref\n${off}\n%%EOF\n`));
  return concat(parts);
}
