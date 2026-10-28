import { parseText, bookWords, DEFAULT_SETTINGS, newMeta, validateBook, validIsbn, chapterToMd, chapterFromMd, parseInline, splitChapter, mergeWithNext, type Book } from "@/lib/books/manuscript";
import { exportEpub } from "@/lib/books/export-epub";
import { exportDocx } from "@/lib/books/export-docx";
import { exportPdf } from "@/lib/books/export-pdf";
import { importDocx } from "@/lib/books/import-docx";
import { parseTtf } from "@/lib/books/ttf";
import { readZip, makeZip, crc32 } from "@/lib/books/zip";

const b64 = (u: Uint8Array) => { let s = ""; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s); };
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

(window as any).runGen = async (fontB64: Record<string, string>, sample: string, sample2: string) => {
  const R: { name: string; ok: boolean; info?: string }[] = [];
  const t = (name: string, ok: boolean, info?: unknown) => R.push({ name, ok, info: ok ? undefined : JSON.stringify(info)?.slice(0, 300) });
  const eq = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

  // inline + parse
  const pi = parseInline("A **bold** and *it* and ***both*** snake_case_name and 2*3*4");
  t("inline bold", pi.some((r) => r.b && r.text === "bold"), pi);
  t("inline italic", pi.some((r) => r.i && !r.b && r.text === "it"), pi);
  t("inline both", pi.some((r) => r.i && r.b && r.text === "both"), pi);
  t("snake_case untouched", pi.map((r) => r.text).join("").includes("snake_case_name"), pi);
  const p1 = parseText(sample);
  t("markdown chapters", p1.report.detected === "markdown" && p1.chapters.length === 4, p1.report);
  const srcWords = (sample.replace(/^#+\s/gm, "").replace(/[*_>]|^\s*[-•]\s|^\s*\d+[.)]\s/gm, "").match(/[\p{L}\p{N}][\p{L}\p{N}\p{M}'’\-]*/gu) ?? []);
  const outWords = bookWords(p1.chapters);
  t("all words preserved (markdown)", eq(srcWords, outWords), { src: srcWords.length, out: outWords.length, diff: srcWords.find((w, i) => w !== outWords[i]) });
  const p2 = parseText(sample2);
  t("chapter-line detection", p2.report.detected === "chapter-lines" && p2.chapters.length === 3 && p2.chapters[0].title === "Prologue", p2.chapters.map((c) => c.title));
  const src2 = sample2.match(/[\p{L}\p{N}][\p{L}\p{N}\p{M}'’\-]*/gu)!;
  t("all words preserved (plain)", eq(src2, bookWords(p2.chapters)), { a: src2.length, b: bookWords(p2.chapters).length });
  const p3 = parseText("Just one paragraph.\n\nAnd another one.");
  t("single chapter fallback", p3.chapters.length === 1 && p3.report.notes.length === 1);
  // md round trip
  const c0 = p1.chapters[1];
  const rt = chapterFromMd(c0, chapterToMd(c0));
  t("chapter md round-trip", JSON.stringify(rt.blocks) === JSON.stringify(c0.blocks), { a: rt.blocks.slice(0, 3), b: c0.blocks.slice(0, 3) });
  const sp = splitChapter(p1.chapters, 1, 2, "Split part");
  t("split chapter", sp.length === 5 && sp[2].title === "Split part" && eq(bookWords(sp).filter((w) => !["Split", "part"].includes(w)), outWords));
  t("merge chapters keeps title as heading", eq(bookWords(mergeWithNext(p1.chapters, 0)), outWords));
  t("isbn check", validIsbn("978-0-306-40615-7") && !validIsbn("978-0-306-40615-8") && validIsbn("0-306-40615-2"));

  const book: Book = { meta: newMeta({ title: "Ọmọ Ọba: The River’s Promise", subtitle: "A novel of Ìbàdàn", author: "Adéwálé Ògúnṣọlá", language: "en", year: "2026", isbn: "978-0-306-40615-7", publisher: "Test Press", dedication: "For my mother — ẹ ṣé." }), chapters: p1.chapters, settings: { ...DEFAULT_SETTINGS } };
  t("validate ok", validateBook(book).filter((i) => i.level === "error").length === 0, validateBook(book));
  t("validate missing title", validateBook({ ...book, meta: { ...book.meta, title: "" } }).some((i) => i.level === "error"));

  // zip basics
  const z = await makeZip([{ name: "a.txt", data: "hello".repeat(100) }, { name: "b/ü.txt", data: "x", store: true }]);
  const ents = readZip(z);
  t("zip round-trip", ents.length === 2 && new TextDecoder().decode(await ents[0].read()) === "hello".repeat(100) && ents[1].name === "b/ü.txt");
  t("crc32", crc32(new TextEncoder().encode("123456789")) === 0xcbf43926);
  let bad = ""; try { readZip(new Uint8Array(100)); } catch (e) { bad = (e as Error).message; }
  t("non-zip rejected with message", /valid/.test(bad), bad);

  const fonts = {
    r: parseTtf(unb64(fontB64.r), "EFYBookSerif-Regular"), b: parseTtf(unb64(fontB64.b), "EFYBookSerif-Bold"),
    i: parseTtf(unb64(fontB64.i), "EFYBookSerif-Italic"), bi: parseTtf(unb64(fontB64.bi), "EFYBookSerif-BoldItalic"),
  };
  t("ttf cmap", fonts.r.glyphFor(0x41) > 0 && fonts.r.glyphFor(0x1eb9) > 0 && fonts.r.advance(fonts.r.glyphFor(0x41)) > 0);

  const out: Record<string, string> = {};
  const epub = await exportEpub(book, { modified: new Date("2026-10-28T10:00:00Z") });
  out.epub = b64(epub);
  const docx = await exportDocx(book);
  out.docx = b64(docx);
  const pdf = await exportPdf(book, fonts);
  out.pdf = b64(pdf.bytes);
  t("pdf has pages", pdf.pages > 8, pdf.pages);
  t("pdf reports missing chars", pdf.missing.includes("🙂"), pdf.missing);
  // other sizes
  for (const ps of ["5x8", "a4", "letter"] as const) {
    const r2 = await exportPdf({ ...book, settings: { ...book.settings, pageSize: ps, justify: ps !== "a4", chapterNewPage: ps !== "letter" } }, fonts);
    out["pdf_" + ps] = b64(r2.bytes);
  }
  // docx round trip through our importer
  const imp = await importDocx(docx);
  const impWords = bookWords(imp.chapters);
  t("docx re-import keeps every word (front matter becomes an opening section)", eq(impWords.slice(impWords.length - outWords.length), outWords) && imp.chapters.length === book.chapters.length + 1, { a: impWords.length, b: outWords.length, first: impWords.find((w, i) => w !== outWords[i]) });
  t("docx re-import title", imp.title === book.meta.title, imp.title);
  t("docx re-import bold kept", imp.chapters.some((c) => c.blocks.some((b) => b.t === "p" && b.runs.some((r) => r.b))));
  t("docx re-import list kept", imp.chapters.some((c) => c.blocks.some((b) => b.t === "list" && b.ordered)));
  (window as any).__words = outWords;
  return { R, out, words: outWords };
};
(window as any).importDocxB64 = async (s: string) => { const r = await importDocx(unb64(s)); return { chapters: r.chapters.map((c) => ({ title: c.title, n: c.blocks.length })), words: bookWords(r.chapters), notes: r.notes, title: r.title }; };
