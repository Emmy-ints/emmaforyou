/**
 * Minimal ZIP writer and reader, used for EPUB and DOCX (both are ZIP containers).
 *
 * Writer: STORE (no compression) or DEFLATE via the platform's CompressionStream("deflate-raw").
 * EPUB requires the first entry to be an uncompressed "mimetype" file, which `store: true` gives.
 * Reader: supports STORE and DEFLATE (DecompressionStream), which covers files saved by Word,
 * Google Docs, LibreOffice and Pages. No ZIP64, encryption or multi-disk archives.
 */

const enc = new TextEncoder();

let CRC_TABLE: Uint32Array | null = null;
export function crc32(data: Uint8Array): number {
  if (!CRC_TABLE) {
    CRC_TABLE = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      CRC_TABLE[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

async function streamBytes(input: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([input as BlobPart]).stream().pipeThrough(stream as unknown as ReadableWritablePair<Uint8Array, Uint8Array>);
  return new Uint8Array(await new Response(out).arrayBuffer());
}
export const deflateRaw = (d: Uint8Array) => streamBytes(d, new CompressionStream("deflate-raw"));
export const inflateRaw = (d: Uint8Array) => streamBytes(d, new DecompressionStream("deflate-raw"));
/** zlib-wrapped deflate (what PDF's FlateDecode expects). */
export const deflateZlib = (d: Uint8Array) => streamBytes(d, new CompressionStream("deflate"));

export interface ZipInput { name: string; data: Uint8Array | string; store?: boolean }

function dosDateTime(d: Date) {
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2);
  const date = ((Math.max(1980, d.getFullYear()) - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  return { time, date };
}

export async function makeZip(files: ZipInput[], when = new Date()): Promise<Uint8Array> {
  const { time, date } = dosDateTime(when);
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  const seen = new Set<string>();
  for (const f of files) {
    if (seen.has(f.name)) throw new Error(`Duplicate file in archive: ${f.name}`);
    seen.add(f.name);
    const raw = typeof f.data === "string" ? enc.encode(f.data) : f.data;
    const crc = crc32(raw);
    let body = raw, method = 0;
    if (!f.store && raw.length > 64) {
      const c = await deflateRaw(raw);
      if (c.length < raw.length) { body = c; method = 8; }
    }
    const name = enc.encode(f.name);
    const lh = new Uint8Array(30 + name.length);
    const lv = new DataView(lh.buffer);
    lv.setUint32(0, 0x04034b50, true); lv.setUint16(4, 20, true); lv.setUint16(6, 0x0800, true); // UTF-8 names
    lv.setUint16(8, method, true); lv.setUint16(10, time, true); lv.setUint16(12, date, true);
    lv.setUint32(14, crc, true); lv.setUint32(18, body.length, true); lv.setUint32(22, raw.length, true);
    lv.setUint16(26, name.length, true); lv.setUint16(28, 0, true);
    lh.set(name, 30);
    const ch = new Uint8Array(46 + name.length);
    const cv = new DataView(ch.buffer);
    cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true); cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, method, true); cv.setUint16(12, time, true); cv.setUint16(14, date, true);
    cv.setUint32(16, crc, true); cv.setUint32(20, body.length, true); cv.setUint32(24, raw.length, true);
    cv.setUint16(28, name.length, true); cv.setUint32(42, offset, true);
    ch.set(name, 46);
    chunks.push(lh, body); central.push(ch);
    offset += lh.length + body.length;
  }
  const cdSize = central.reduce((a, c) => a + c.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true); ev.setUint16(8, files.length, true); ev.setUint16(10, files.length, true);
  ev.setUint32(12, cdSize, true); ev.setUint32(16, offset, true);
  return concat([...chunks, ...central, end]);
}

export function concat(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((a, p) => a + p.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

export interface ZipEntry { name: string; size: number; read: () => Promise<Uint8Array> }

/** List the entries of a ZIP archive (central directory). Throws a readable error for non-ZIP input. */
export function readZip(buf: Uint8Array, maxEntries = 5000, maxUncompressed = 200 * 1024 * 1024): ZipEntry[] {
  const v = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (v.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("This file isn't a valid .docx (no ZIP directory found).");
  const count = v.getUint16(eocd + 10, true);
  let p = v.getUint32(eocd + 16, true);
  if (count > maxEntries) throw new Error("This file has too many parts to open safely.");
  const dec = new TextDecoder();
  const out: ZipEntry[] = [];
  let total = 0;
  for (let n = 0; n < count; n++) {
    if (p + 46 > buf.length || v.getUint32(p, true) !== 0x02014b50) throw new Error("The file's ZIP directory is damaged.");
    const method = v.getUint16(p + 10, true);
    const csize = v.getUint32(p + 20, true);
    const usize = v.getUint32(p + 24, true);
    const nlen = v.getUint16(p + 28, true), xlen = v.getUint16(p + 30, true), clen = v.getUint16(p + 32, true);
    const lho = v.getUint32(p + 42, true);
    const flags = v.getUint16(p + 8, true);
    const name = dec.decode(buf.subarray(p + 46, p + 46 + nlen));
    total += usize;
    if (total > maxUncompressed) throw new Error("This file expands to more than 200 MB, so it wasn't opened.");
    out.push({
      name, size: usize,
      read: async () => {
        if (flags & 1) throw new Error("Password-protected documents can't be opened.");
        if (v.getUint32(lho, true) !== 0x04034b50) throw new Error(`Damaged entry ${name}`);
        const start = lho + 30 + v.getUint16(lho + 26, true) + v.getUint16(lho + 28, true);
        const data = buf.subarray(start, start + csize);
        if (method === 0) return data.slice();
        if (method === 8) return inflateRaw(data);
        throw new Error(`Unsupported compression in ${name}`);
      },
    });
    p += 46 + nlen + xlen + clen;
  }
  return out;
}
