/**
 * Just enough TrueType parsing to typeset text into a PDF: character → glyph mapping (cmap
 * formats 4 and 12), advance widths (hmtx) and the metrics a PDF FontDescriptor needs.
 */
export interface TtfFont {
  name: string;
  bytes: Uint8Array;
  unitsPerEm: number;
  ascent: number; descent: number; capHeight: number; italicAngle: number;
  bbox: [number, number, number, number];
  flags: number;
  glyphFor(cp: number): number; // 0 = missing
  advance(gid: number): number; // font units
  bounds(gid: number): [number, number, number, number] | null; // xMin, yMin, xMax, yMax (font units)
  xHeight: number;
}

export function parseTtf(bytes: Uint8Array, name: string): TtfFont {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const numTables = v.getUint16(4);
  const tables = new Map<string, { off: number; len: number }>();
  for (let i = 0; i < numTables; i++) {
    const p = 12 + i * 16;
    const tag = String.fromCharCode(bytes[p], bytes[p + 1], bytes[p + 2], bytes[p + 3]);
    tables.set(tag, { off: v.getUint32(p + 8), len: v.getUint32(p + 12) });
  }
  const need = (t: string) => { const x = tables.get(t); if (!x) throw new Error(`Font ${name} lacks ${t}`); return x.off; };
  const head = need("head"), hhea = need("hhea"), hmtx = need("hmtx"), cmap = need("cmap"), maxp = need("maxp");
  const unitsPerEm = v.getUint16(head + 18);
  const bbox: [number, number, number, number] = [v.getInt16(head + 36), v.getInt16(head + 38), v.getInt16(head + 40), v.getInt16(head + 42)];
  const numGlyphs = v.getUint16(maxp + 4);
  const numHMetrics = v.getUint16(hhea + 34);
  let ascent = v.getInt16(hhea + 4), descent = v.getInt16(hhea + 6), capHeight = Math.round(ascent * 0.7), xHeight = Math.round(unitsPerEm * 0.5);
  const os2 = tables.get("OS/2");
  if (os2) {
    ascent = v.getInt16(os2.off + 68); descent = v.getInt16(os2.off + 70);
    if (v.getUint16(os2.off) >= 2 && os2.len >= 90) { xHeight = v.getInt16(os2.off + 86); capHeight = v.getInt16(os2.off + 88); }
  }
  const post = tables.get("post");
  const italicAngle = post ? v.getInt32(post.off + 4) / 65536 : 0;

  const advances = new Uint16Array(numGlyphs);
  let last = 0;
  for (let g = 0; g < numGlyphs; g++) {
    if (g < numHMetrics) last = v.getUint16(hmtx + g * 4);
    advances[g] = last;
  }

  // cmap: prefer (3,10) format 12, then (3,1)/(0,x) format 4
  const nSub = v.getUint16(cmap + 2);
  let best = -1, bestScore = -1;
  for (let i = 0; i < nSub; i++) {
    const pid = v.getUint16(cmap + 4 + i * 8), eid = v.getUint16(cmap + 6 + i * 8), off = v.getUint32(cmap + 8 + i * 8);
    const fmt = v.getUint16(cmap + off);
    const score = fmt === 12 && (pid === 3 || pid === 0) ? 3 : fmt === 4 && ((pid === 3 && eid === 1) || pid === 0) ? 2 : 0;
    if (score > bestScore) { bestScore = score; best = cmap + off; }
  }
  if (best < 0 || bestScore <= 0) throw new Error(`Font ${name} has no Unicode cmap`);
  const map = new Map<number, number>();
  const fmt = v.getUint16(best);
  if (fmt === 4) {
    const segX2 = v.getUint16(best + 6);
    const ends = best + 14, starts = ends + segX2 + 2, deltas = starts + segX2, ranges = deltas + segX2;
    for (let s = 0; s < segX2 / 2; s++) {
      const end = v.getUint16(ends + s * 2), start = v.getUint16(starts + s * 2);
      const delta = v.getInt16(deltas + s * 2), ro = v.getUint16(ranges + s * 2);
      for (let c = start; c <= end && c !== 0xffff; c++) {
        let g: number;
        if (ro === 0) g = (c + delta) & 0xffff;
        else {
          const gp = ranges + s * 2 + ro + (c - start) * 2;
          g = v.getUint16(gp); if (g) g = (g + delta) & 0xffff;
        }
        if (g) map.set(c, g);
      }
    }
  } else {
    const nGroups = v.getUint32(best + 12);
    for (let i = 0; i < nGroups; i++) {
      const p = best + 16 + i * 12;
      const sc = v.getUint32(p), ec = v.getUint32(p + 4), sg = v.getUint32(p + 8);
      for (let c = sc; c <= ec; c++) map.set(c, sg + (c - sc));
    }
  }
  const loca = tables.get("loca"), glyf = tables.get("glyf");
  const longLoca = v.getInt16(head + 50) === 1;
  const bounds = (gid: number): [number, number, number, number] | null => {
    if (!loca || !glyf || gid < 0 || gid >= numGlyphs) return null;
    const o0 = longLoca ? v.getUint32(loca.off + gid * 4) : v.getUint16(loca.off + gid * 2) * 2;
    const o1 = longLoca ? v.getUint32(loca.off + gid * 4 + 4) : v.getUint16(loca.off + gid * 2 + 2) * 2;
    if (o1 <= o0) return null;
    const g = glyf.off + o0;
    return [v.getInt16(g + 2), v.getInt16(g + 4), v.getInt16(g + 6), v.getInt16(g + 8)];
  };
  const flags = (italicAngle !== 0 ? 64 : 0) | 32 | 2; // italic? | nonsymbolic | serif-ish (informational)
  return {
    name, bytes, unitsPerEm, ascent, descent, capHeight, italicAngle, bbox, flags,
    glyphFor: (cp) => map.get(cp) ?? 0,
    advance: (gid) => advances[gid] ?? 0,
    bounds, xHeight,
  };
}

/** Characters with no glyph in the bundled fonts, mapped to safe stand-ins (reported to the user). */
export const FALLBACKS: Record<string, string> = {
  "₦": "N", "​": "", "﻿": "", "­": "", "→": "->", "←": "<-", "✓": "v", "✔": "v", "★": "*", "☆": "*", "♥": "<3", "❤": "<3", " ": " ", " ": " ",
};
