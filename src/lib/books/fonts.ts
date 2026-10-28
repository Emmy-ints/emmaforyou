/** Loads the bundled open-licence fonts for canvas drawing (covers, mockups, page preview) and PDF export. */
import { parseTtf, type TtfFont } from "./ttf";
import type { FontSet } from "./layout";

export const SERIF = "EFYBookSerif";
export const SANS = "EFYBookSans";
const FILES = {
  r: "/fonts/book/BookSerif-Regular.ttf", b: "/fonts/book/BookSerif-Bold.ttf",
  i: "/fonts/book/BookSerif-Italic.ttf", bi: "/fonts/book/BookSerif-BoldItalic.ttf",
  sl: "/fonts/book/Poppins-Light.ttf", sr: "/fonts/book/Poppins-Regular.ttf", sb: "/fonts/book/Poppins-Bold.ttf",
} as const;

let bytesCache: Promise<Record<keyof typeof FILES, ArrayBuffer>> | null = null;
function loadBytes() {
  bytesCache ??= Promise.all(Object.entries(FILES).map(async ([k, url]) => {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Couldn't load font ${url} (${r.status})`);
    return [k, await r.arrayBuffer()] as const;
  })).then((e) => Object.fromEntries(e) as Record<keyof typeof FILES, ArrayBuffer>).catch((e) => { bytesCache = null; throw e; });
  return bytesCache;
}

let faces: Promise<void> | null = null;
/** Register the fonts with the document so canvas text uses them. */
export function loadCanvasFonts(): Promise<void> {
  faces ??= loadBytes().then(async (b) => {
    const defs: [string, ArrayBuffer, FontFaceDescriptors][] = [
      [SERIF, b.r, { weight: "400", style: "normal" }], [SERIF, b.b, { weight: "700", style: "normal" }],
      [SERIF, b.i, { weight: "400", style: "italic" }], [SERIF, b.bi, { weight: "700", style: "italic" }],
      [SANS, b.sl, { weight: "300" }], [SANS, b.sr, { weight: "400" }], [SANS, b.sb, { weight: "700" }],
    ];
    for (const [fam, buf, d] of defs) {
      const f = new FontFace(fam, buf.slice(0), d);
      await f.load();
      (document.fonts as unknown as { add(f: FontFace): void }).add(f);
    }
  }).catch((e) => { faces = null; throw e; });
  return faces;
}

let pdfFonts: Promise<FontSet> | null = null;
export function loadPdfFonts(): Promise<FontSet> {
  pdfFonts ??= loadBytes().then((b) => ({
    r: parseTtf(new Uint8Array(b.r), "EFYBookSerif-Regular"),
    b: parseTtf(new Uint8Array(b.b), "EFYBookSerif-Bold"),
    i: parseTtf(new Uint8Array(b.i), "EFYBookSerif-Italic"),
    bi: parseTtf(new Uint8Array(b.bi), "EFYBookSerif-BoldItalic"),
  })).catch((e) => { pdfFonts = null; throw e; });
  return pdfFonts;
}
export type { TtfFont };
