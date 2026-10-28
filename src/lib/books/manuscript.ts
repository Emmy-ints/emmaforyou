/**
 * The book model shared by the eBook Creator, its importers and its exporters.
 *
 * Rule: nothing here rewrites the author's words. Parsing only splits text into chapters and
 * blocks and reads light formatting marks (Markdown-style **bold**, *italic*, headings, lists,
 * quotes, scene breaks). `bookWords()` lets tests (and the UI) prove that every word survives.
 */

export interface Run { text: string; b?: boolean; i?: boolean }
export type Block =
  | { t: "p"; runs: Run[] }
  | { t: "h"; level: 2 | 3; runs: Run[] }
  | { t: "quote"; runs: Run[] }
  | { t: "list"; ordered: boolean; items: Run[][] }
  | { t: "break" };

export interface Chapter { id: string; title: string; blocks: Block[] }

export type PageSize = "5x8" | "5.25x8" | "5.5x8.5" | "6x9" | "a5" | "a4" | "letter";
export interface BookMeta {
  title: string;
  subtitle?: string;
  author: string;
  language: string; // BCP 47, e.g. "en", "en-GB", "yo"
  publisher?: string;
  description?: string;
  isbn?: string;
  year?: string;
  rights?: string; // copyright line text
  dedication?: string;
  identifier: string; // urn:uuid:… for EPUB
}
export interface BookSettings {
  pageSize: PageSize;
  fontSize: number; // pt, 9–14
  lineHeight: number; // multiple, 1.2–1.8
  justify: boolean;
  chapterNewPage: boolean;
  includeToc: boolean;
  includeCopyright: boolean;
  mirrorMargins: boolean; // print interior (inside/outside margins)
}
export interface Book { meta: BookMeta; chapters: Chapter[]; settings: BookSettings }

export const PAGE_SIZES: Record<PageSize, { label: string; w: number; h: number; print: boolean }> = {
  // points (1 in = 72 pt). Trim sizes common for print-on-demand paperbacks, plus screen/office sizes.
  "5x8": { label: "5 × 8 in (paperback)", w: 360, h: 576, print: true },
  "5.25x8": { label: "5.25 × 8 in (paperback)", w: 378, h: 576, print: true },
  "5.5x8.5": { label: "5.5 × 8.5 in (paperback)", w: 396, h: 612, print: true },
  "6x9": { label: "6 × 9 in (paperback)", w: 432, h: 648, print: true },
  a5: { label: "A5 (148 × 210 mm)", w: 419.53, h: 595.28, print: true },
  a4: { label: "A4 (screen / office)", w: 595.28, h: 841.89, print: false },
  letter: { label: "US Letter (screen / office)", w: 612, h: 792, print: false },
};

export const DEFAULT_SETTINGS: BookSettings = {
  pageSize: "6x9", fontSize: 11, lineHeight: 1.45, justify: true, chapterNewPage: true,
  includeToc: true, includeCopyright: true, mirrorMargins: true,
};

export function uuid(): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  const b = new Uint8Array(16); c.getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export function newMeta(p: Partial<BookMeta> = {}): BookMeta {
  return { title: "", author: "", language: "en", identifier: `urn:uuid:${uuid()}`, ...p };
}

export const runsText = (r: Run[]) => r.map((x) => x.text).join("");

/** Parse inline Markdown-style emphasis: **bold**, __bold__, *italic*, _italic_. Unmatched marks stay as text. */
export function parseInline(s: string): Run[] {
  const out: Run[] = [];
  const re = /(\*\*\*|\*\*|__|\*|_)(?=\S)([\s\S]*?\S)\1(?![\p{L}\p{N}])/gu;
  let last = 0; let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    // "_" inside words (snake_case, file_names) isn't emphasis
    if ((m[1] === "_" || m[1] === "__") && m.index > 0 && /[\p{L}\p{N}]/u.test(s[m.index - 1])) continue;
    if (m.index > last) out.push({ text: s.slice(last, m.index) });
    const mark = m[1];
    const inner = parseInline(m[2]);
    for (const r of inner) out.push({ ...r, b: r.b || mark === "**" || mark === "__" || mark === "***", i: r.i || mark === "*" || mark === "_" || mark === "***" });
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push({ text: s.slice(last) });
  return mergeRuns(out);
}

export function mergeRuns(runs: Run[]): Run[] {
  const out: Run[] = [];
  for (const r of runs) {
    if (!r.text) continue;
    const p = out[out.length - 1];
    if (p && !!p.b === !!r.b && !!p.i === !!r.i) p.text += r.text;
    else out.push({ text: r.text, ...(r.b ? { b: true } : {}), ...(r.i ? { i: true } : {}) });
  }
  return out;
}

const CHAPTER_WORD = /^(chapter|chap\.|part|prologue|epilogue|introduction|preface|foreword|afterword|acknowledg(e)?ments|appendix|interlude|conclusion|orí|abala|chapitre|capítulo|kapitel)\b/i;
const SCENE_BREAK = /^\s*(\*\s*\*\s*\*|\*{3,}|-{3,}|_{3,}|#|~{3,}|•\s*•\s*•)\s*$/;

/** Does a short standalone line look like a chapter heading ("Chapter 3", "CHAPTER ONE: Rain", "Prologue")? */
export function looksLikeChapterHeading(line: string): boolean {
  const l = line.trim();
  if (!l || l.length > 80) return false;
  if (CHAPTER_WORD.test(l)) return /^[^.!?]*[.!?]?$/.test(l) && l.split(/\s+/).length <= 10;
  return false;
}

export interface ParseReport { chapters: number; words: number; detected: "markdown" | "chapter-lines" | "single"; notes: string[] }

/**
 * Split pasted text or Markdown into chapters.
 * - "# Title" lines start chapters (Markdown). "##"/"###" become sub-headings.
 * - Otherwise standalone lines such as "Chapter 1" / "Prologue" start chapters.
 * - Otherwise everything is one chapter (the author can split it in the editor).
 * Text before the first heading becomes an untitled opening chapter, never dropped.
 */
export function parseText(input: string, fallbackTitle = "Chapter 1"): { chapters: Chapter[]; report: ParseReport } {
  const text = input.replace(/\r\n?/g, "\n").replace(/ /g, " ").replace(/\t/g, "    ");
  const lines = text.split("\n");
  const hasMd = lines.some((l) => /^#\s+\S/.test(l));
  const paraLines = (i: number) => (i === 0 || !lines[i - 1].trim()) && (i === lines.length - 1 || !lines[i + 1].trim());
  const hasChapterLines = !hasMd && lines.filter((l, i) => paraLines(i) && looksLikeChapterHeading(l)).length >= 1;
  const notes: string[] = [];
  const chapters: Chapter[] = [];
  let cur: Chapter | null = null;
  const ensure = () => { if (!cur) { cur = { id: uuid(), title: chapters.length ? `Chapter ${chapters.length + 1}` : fallbackTitle, blocks: [] }; chapters.push(cur); } return cur; };

  let para: string[] = [];
  let list: { ordered: boolean; items: Run[][] } | null = null;
  let quote: string[] = [];
  const flushPara = () => { if (para.length) { ensure().blocks.push({ t: "p", runs: parseInline(para.join(" ").replace(/\s+/g, " ").trim()) }); para = []; } };
  const flushList = () => { if (list) { ensure().blocks.push({ t: "list", ...list }); list = null; } };
  const flushQuote = () => { if (quote.length) { ensure().blocks.push({ t: "quote", runs: parseInline(quote.join(" ").replace(/\s+/g, " ").trim()) }); quote = []; } };
  const flushAll = () => { flushPara(); flushList(); flushQuote(); };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const l = raw.trim();
    if (!l) { flushAll(); continue; }
    let m: RegExpMatchArray | null;
    if (hasMd && (m = l.match(/^#\s+(.+?)\s*#*$/))) { flushAll(); cur = { id: uuid(), title: stripMarks(m[1]), blocks: [] }; chapters.push(cur); continue; }
    if (hasChapterLines && paraLines(i) && looksLikeChapterHeading(l)) {
      flushAll();
      // "Chapter 1" followed by a short title line on its own → combine ("Chapter 1: The Rain")
      cur = { id: uuid(), title: stripMarks(l), blocks: [] }; chapters.push(cur);
      continue;
    }
    if ((m = l.match(/^(#{2,6})\s+(.+?)\s*#*$/))) { flushAll(); ensure().blocks.push({ t: "h", level: m[1].length === 2 ? 2 : 3, runs: parseInline(m[2]) }); continue; }
    if (SCENE_BREAK.test(l)) { flushAll(); ensure().blocks.push({ t: "break" }); continue; }
    if ((m = l.match(/^>\s?(.*)$/))) { flushPara(); flushList(); quote.push(m[1]); continue; }
    if ((m = l.match(/^([-*+•])\s+(.+)$/)) || (m = l.match(/^(\d{1,3})[.)]\s+(.+)$/))) {
      flushPara(); flushQuote();
      const ordered = /\d/.test(m[1]);
      if (!list || list.ordered !== ordered) { flushList(); list = { ordered, items: [] }; }
      list.items.push(parseInline(m[2]));
      continue;
    }
    if (list && /^\s{2,}\S/.test(raw)) { const it = list.items[list.items.length - 1]; it.push({ text: " " }, ...parseInline(l)); continue; }
    flushList(); flushQuote();
    para.push(l);
  }
  flushAll();
  if (!chapters.length) chapters.push({ id: uuid(), title: fallbackTitle, blocks: [] });
  // Drop an empty opening chapter created only by leading blank text (never one with content)
  const result = chapters.filter((c, idx) => c.blocks.length || idx > 0 || chapters.length === 1);
  const words = result.reduce((a, c) => a + chapterWords(c).length, 0);
  if (!hasMd && !hasChapterLines) notes.push("No chapter headings were found, so the text is one chapter. Split it with “Split here” or add lines like “Chapter 2”.");
  return { chapters: result, report: { chapters: result.length, words, detected: hasMd ? "markdown" : hasChapterLines ? "chapter-lines" : "single", notes } };
}

function stripMarks(s: string) { return runsText(parseInline(s)).trim(); }

export function blockText(b: Block): string {
  if (b.t === "break") return "";
  if (b.t === "list") return b.items.map(runsText).join("\n");
  return runsText(b.runs);
}
export const WORD_RE = /[\p{L}\p{N}][\p{L}\p{N}\p{M}'’\-]*/gu;
export function chapterWords(c: Chapter): string[] {
  return c.blocks.flatMap((b) => blockText(b).match(WORD_RE) ?? []);
}
/** Every word in the book, title words included (used to prove nothing was lost). */
export function bookWords(chs: Chapter[]): string[] {
  return chs.flatMap((c) => [...(c.title.match(WORD_RE) ?? []), ...chapterWords(c)]);
}
export function wordCount(chs: Chapter[]) { return chs.reduce((a, c) => a + chapterWords(c).length, 0); }

/** Serialize back to the Markdown-style text the editor shows (round-trips with parseText). */
export function runsToMd(r: Run[]): string {
  return r.map((x) => {
    if (!x.text.trim()) return x.text;
    const lead = x.text.match(/^\s*/)![0], trail = x.text.match(/\s*$/)![0], core = x.text.trim();
    const mark = x.b && x.i ? "***" : x.b ? "**" : x.i ? "*" : "";
    return lead + mark + core + mark + trail;
  }).join("");
}
export function chapterToMd(c: Chapter): string {
  return c.blocks.map((b) => {
    if (b.t === "p") return runsToMd(b.runs);
    if (b.t === "h") return `${b.level === 2 ? "##" : "###"} ${runsToMd(b.runs)}`;
    if (b.t === "quote") return `> ${runsToMd(b.runs)}`;
    if (b.t === "list") return b.items.map((it, i) => `${b.ordered ? `${i + 1}.` : "-"} ${runsToMd(it)}`).join("\n");
    return "* * *";
  }).join("\n\n");
}
/** Replace a chapter's body from edited Markdown-style text (keeps id and title). */
export function chapterFromMd(c: Chapter, md: string): Chapter {
  const { chapters } = parseText(md.replace(/^#\s/gm, "## "), c.title);
  return { ...c, blocks: chapters.flatMap((x) => x.blocks) };
}

export function splitChapter(chs: Chapter[], idx: number, blockIdx: number, title: string): Chapter[] {
  const c = chs[idx];
  if (!c || blockIdx <= 0 || blockIdx >= c.blocks.length) return chs;
  const a = { ...c, blocks: c.blocks.slice(0, blockIdx) };
  const b = { id: uuid(), title, blocks: c.blocks.slice(blockIdx) };
  return [...chs.slice(0, idx), a, b, ...chs.slice(idx + 1)];
}
export function mergeWithNext(chs: Chapter[], idx: number): Chapter[] {
  const a = chs[idx], b = chs[idx + 1];
  if (!a || !b) return chs;
  const heading: Block = { t: "h", level: 2, runs: [{ text: b.title }] };
  return [...chs.slice(0, idx), { ...a, blocks: [...a.blocks, heading, ...b.blocks] }, ...chs.slice(idx + 2)];
}
export function moveChapter(chs: Chapter[], idx: number, dir: -1 | 1): Chapter[] {
  const j = idx + dir;
  if (j < 0 || j >= chs.length) return chs;
  const out = chs.slice(); [out[idx], out[j]] = [out[j], out[idx]];
  return out;
}

// ---------- shared escaping / validation ----------
export function xmlEscape(s: string): string {
  // also strips characters XML 1.0 forbids (control chars), which would make EPUB/DOCX unreadable
  return s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f￾￿]/g, "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
export function safeFileName(s: string, ext: string): string {
  const base = s.normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "book";
  return `${base}.${ext}`;
}

export const LIMITS = {
  maxChars: 1_500_000, // ≈ 250k words; keeps browser exports responsive
  maxUploadBytes: 15 * 1024 * 1024,
  maxChapters: 300,
};

export interface ValidationIssue { level: "error" | "warn"; message: string }
export function validateBook(b: Book): ValidationIssue[] {
  const out: ValidationIssue[] = [];
  if (!b.meta.title.trim()) out.push({ level: "error", message: "Add a book title." });
  if (!b.meta.author.trim()) out.push({ level: "error", message: "Add the author name (as it should appear on the book)." });
  if (!b.chapters.length || wordCount(b.chapters) === 0) out.push({ level: "error", message: "Add your manuscript text." });
  if (b.chapters.length > LIMITS.maxChapters) out.push({ level: "error", message: `At most ${LIMITS.maxChapters} chapters.` });
  if (!/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(b.meta.language)) out.push({ level: "error", message: "Language must be a code such as en, en-GB, fr or yo." });
  const empty = b.chapters.filter((c) => !chapterWords(c).length);
  if (empty.length) out.push({ level: "warn", message: `${empty.length} chapter${empty.length > 1 ? "s are" : " is"} empty: ${empty.slice(0, 3).map((c) => `“${c.title}”`).join(", ")}.` });
  const untitled = b.chapters.filter((c) => !c.title.trim());
  if (untitled.length) out.push({ level: "warn", message: `${untitled.length} chapter${untitled.length > 1 ? "s have" : " has"} no title.` });
  if (b.meta.isbn && !validIsbn(b.meta.isbn)) out.push({ level: "warn", message: "The ISBN doesn't pass the ISBN-10/13 check digit. Leave it blank if you don't have one yet." });
  return out;
}

export function validIsbn(raw: string): boolean {
  const s = raw.replace(/[\s-]/g, "").toUpperCase();
  if (/^\d{13}$/.test(s)) {
    const sum = [...s].reduce((a, d, i) => a + Number(d) * (i % 2 ? 3 : 1), 0);
    return sum % 10 === 0;
  }
  if (/^\d{9}[\dX]$/.test(s)) {
    const sum = [...s].reduce((a, d, i) => a + (d === "X" ? 10 : Number(d)) * (10 - i), 0);
    return sum % 11 === 0;
  }
  return false;
}
