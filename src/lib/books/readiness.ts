/**
 * Publishing readiness checks. Each check says how it was made:
 *  - "checked": the app measured it from the file or details given;
 *  - "platform": only the store's own upload/previewer can confirm it;
 *  - "person": needs human judgement (proofreading, rights, quality).
 */
import { EBOOK_COVER, METADATA, PRINT_COVER } from "./specs";
import { validIsbn } from "./manuscript";
import { lintDescription, lintKeyword } from "./listing";

export type Status = "pass" | "fix" | "warn" | "info";
export interface Check { id: string; area: "Manuscript" | "Cover" | "Listing" | "Files"; label: string; status: Status; detail: string; how: "checked" | "platform" | "person" }

export interface ManuscriptFacts { name: string; kind: "docx" | "epub" | "pdf" | "text"; bytes: number; words: number; chapters: number; emptyChapters: number; headingsStyled: boolean | null; images: number; notes: string[]; epub?: EpubFacts; pdf?: PdfFacts }
export interface EpubFacts { mimetypeFirst: boolean; container: boolean; opf: boolean; nav: boolean; ncx: boolean; title: string; author: string; language: string; identifier: boolean; missingFiles: string[]; badXml: string[]; spineItems: number; version: string }
export interface PdfFacts { version: string; pages: number | null; pageSizes: string[]; fontsEmbedded: boolean | null; encrypted: boolean }
export interface CoverFacts { name: string; type: string; bytes: number; width: number; height: number }
export interface ListingFacts { title: string; subtitle: string; author: string; description: string; keywords: string[]; categories: number; isbn: string; format: "ebook" | "paperback" | "both"; pages: number | null }

export function runChecks(m: ManuscriptFacts | null, c: CoverFacts | null, l: ListingFacts): Check[] {
  const out: Check[] = [];
  const add = (x: Check) => out.push(x);
  // ---- manuscript (from the uploaded file)
  if (!m) add({ id: "ms", area: "Manuscript", label: "Manuscript file", status: "info", detail: "Upload your .docx, .epub, .pdf or .txt to check it.", how: "checked" });
  else {
    add({ id: "ms-size", area: "Manuscript", label: "File opens", status: "pass", detail: `${m.name} (${(m.bytes / 1048576).toFixed(1)} MB) was read successfully.`, how: "checked" });
    if (m.words) add({ id: "ms-words", area: "Manuscript", label: "Word count", status: m.words < 2500 ? "warn" : "pass", detail: `${m.words.toLocaleString()} words${m.words < 2500 ? " — very short for a book. Fine for a guide or short story; check reader expectations for your genre." : "."}`, how: "checked" });
    if (m.chapters) add({ id: "ms-ch", area: "Manuscript", label: "Chapters found", status: m.chapters < 2 ? "warn" : "pass", detail: m.chapters < 2 ? "Only one chapter/section was detected. Use Heading 1 for chapter titles so readers get a contents menu." : `${m.chapters} chapters detected.`, how: "checked" });
    if (m.emptyChapters) add({ id: "ms-empty", area: "Manuscript", label: "Empty chapters", status: "fix", detail: `${m.emptyChapters} chapter heading${m.emptyChapters > 1 ? "s have" : " has"} no text after it.`, how: "checked" });
    if (m.headingsStyled === false) add({ id: "ms-styles", area: "Manuscript", label: "Heading styles", status: "warn", detail: "Chapter titles aren't using Word's Heading styles. Converters rely on them to build the contents and navigation.", how: "checked" });
    if (m.images) add({ id: "ms-img", area: "Manuscript", label: "Images", status: "info", detail: `${m.images} image${m.images > 1 ? "s" : ""} found. Check they're at least 300 DPI for print and that you have the rights to use them.`, how: "person" });
    for (const n of m.notes) add({ id: `ms-note-${out.length}`, area: "Manuscript", label: "Import note", status: "info", detail: n, how: "checked" });
    if (m.epub) {
      const e = m.epub;
      add({ id: "ep-mime", area: "Files", label: "EPUB container", status: e.mimetypeFirst && e.container && e.opf ? "pass" : "fix", detail: e.mimetypeFirst && e.container && e.opf ? `EPUB ${e.version}: mimetype first, container and package file present.` : `Problems: ${[!e.mimetypeFirst && "the mimetype file must be first and uncompressed", !e.container && "META-INF/container.xml missing", !e.opf && "package (.opf) file missing"].filter(Boolean).join("; ")}.`, how: "checked" });
      add({ id: "ep-nav", area: "Files", label: "Navigation", status: e.nav ? "pass" : "fix", detail: e.nav ? `Navigation document present${e.ncx ? " (plus toc.ncx for older readers)" : ""}.` : "No EPUB 3 navigation document (nav) found; readers won't have a contents menu.", how: "checked" });
      add({ id: "ep-meta", area: "Files", label: "Metadata", status: e.title && e.language && e.identifier ? "pass" : "fix", detail: `Title: ${e.title || "missing"} · Author: ${e.author || "missing"} · Language: ${e.language || "missing"} · Identifier: ${e.identifier ? "present" : "missing"}.`, how: "checked" });
      if (e.missingFiles.length) add({ id: "ep-missing", area: "Files", label: "Missing files", status: "fix", detail: `Listed in the package but not in the file: ${e.missingFiles.slice(0, 5).join(", ")}${e.missingFiles.length > 5 ? "…" : ""}.`, how: "checked" });
      if (e.badXml.length) add({ id: "ep-xml", area: "Files", label: "Broken pages", status: "fix", detail: `These pages aren't valid XHTML, so some readers may refuse the book: ${e.badXml.slice(0, 5).join(", ")}.`, how: "checked" });
      add({ id: "ep-check", area: "Files", label: "Full EPUB validation", status: "info", detail: "We check structure, metadata and well-formed pages. Stores run their own validation (similar to EPUBCheck) on upload — fix anything they report.", how: "platform" });
    }
    if (m.pdf) {
      const p = m.pdf;
      add({ id: "pdf-open", area: "Files", label: "PDF", status: p.encrypted ? "fix" : "pass", detail: p.encrypted ? "The PDF is password-protected or encrypted. Print platforms need an unlocked file." : `PDF ${p.version}${p.pages ? `, ${p.pages} pages` : ""}${p.pageSizes.length ? `, page size ${p.pageSizes.join(" / ")}` : ""}.`, how: "checked" });
      if (p.pageSizes.length > 1) add({ id: "pdf-sizes", area: "Files", label: "Page sizes", status: "fix", detail: "Pages have different sizes. A print interior must use one trim size throughout.", how: "checked" });
      if (p.fontsEmbedded === false) add({ id: "pdf-fonts", area: "Files", label: "Fonts", status: "fix", detail: "At least one font isn't embedded. Print platforms require embedded fonts.", how: "checked" });
      else if (p.fontsEmbedded) add({ id: "pdf-fonts", area: "Files", label: "Fonts", status: "pass", detail: "Fonts referenced on the pages we sampled are embedded.", how: "checked" });
      if (p.pages != null && p.pages < PRINT_COVER.minPages) add({ id: "pdf-min", area: "Files", label: "Page count", status: "fix", detail: `KDP paperbacks need at least ${PRINT_COVER.minPages} pages.`, how: "checked" });
      add({ id: "pdf-margins", area: "Files", label: "Margins and bleed", status: "info", detail: "Margins, bleed and image resolution are checked by the print platform's previewer on upload.", how: "platform" });
    }
  }
  // ---- cover
  if (!c) add({ id: "cv", area: "Cover", label: "Cover image", status: "info", detail: "Upload your eBook cover (JPEG/TIFF/PNG) to check its size.", how: "checked" });
  else {
    const ratio = c.height / c.width;
    add({ id: "cv-size", area: "Cover", label: "Cover dimensions", status: c.width < EBOOK_COVER.minW || c.height < EBOOK_COVER.minH ? "fix" : c.width < EBOOK_COVER.idealW || c.height < EBOOK_COVER.idealH ? "warn" : "pass", detail: `${c.width} × ${c.height} px. KDP minimum ${EBOOK_COVER.minW} × ${EBOOK_COVER.minH}; ideal ${EBOOK_COVER.idealW} × ${EBOOK_COVER.idealH}.`, how: "checked" });
    add({ id: "cv-ratio", area: "Cover", label: "Shape (height ÷ width)", status: ratio >= EBOOK_COVER.minRatio - 0.02 ? "pass" : "warn", detail: `${ratio.toFixed(2)}:1. KDP recommends ${EBOOK_COVER.minRatio}:1.`, how: "checked" });
    add({ id: "cv-type", area: "Cover", label: "File type and size", status: /jpe?g|tiff/.test(c.type) ? (c.bytes > EBOOK_COVER.maxMb * 1048576 ? "fix" : "pass") : "warn", detail: `${c.type || "unknown type"}, ${(c.bytes / 1048576).toFixed(1)} MB. KDP prefers JPEG (or TIFF), under ${EBOOK_COVER.maxMb} MB.`, how: "checked" });
    add({ id: "cv-text", area: "Cover", label: "Title readable at thumbnail size", status: "info", detail: "Look at the small preview: can you read the title? Readers see covers this small in search results.", how: "person" });
    add({ id: "cv-rights", area: "Cover", label: "Image and font rights", status: "info", detail: "Make sure you own or licensed every image and font on the cover for commercial use. Some stores ask you to declare AI-generated images.", how: "person" });
  }
  // ---- listing
  add({ id: "ls-title", area: "Listing", label: "Title and author", status: l.title.trim() && l.author.trim() ? "pass" : "fix", detail: l.title.trim() && l.author.trim() ? "Provided. They must match the cover and the title page exactly." : "Add the title and author name exactly as on the cover.", how: "checked" });
  if (/\b(best|bestseller|#1|free|new|book \d|volume)\b/i.test(`${l.title} ${l.subtitle}`)) add({ id: "ls-title-claims", area: "Listing", label: "Title wording", status: "warn", detail: "Titles and subtitles shouldn't contain claims or promotional words (best, #1, free, new). Series numbers go in the series field.", how: "checked" });
  if (!l.description.trim()) add({ id: "ls-desc", area: "Listing", label: "Description", status: "fix", detail: "Add your book description.", how: "checked" });
  else { const lint = lintDescription(l.description); add({ id: "ls-desc", area: "Listing", label: "Description", status: lint.length ? "fix" : "pass", detail: lint.length ? lint.join(" ") : `${l.description.length.toLocaleString()} characters, within ${METADATA.descriptionMax.toLocaleString()} and no disallowed content found.`, how: "checked" }); }
  const kws = l.keywords.map((k) => k.trim()).filter(Boolean);
  const kwIssues = kws.map((k) => lintKeyword(k, `${l.title} ${l.subtitle} ${l.author}`)).filter(Boolean) as string[];
  add({ id: "ls-kw", area: "Listing", label: "Keywords", status: !kws.length ? "warn" : kwIssues.length || kws.length > METADATA.keywordBoxes ? "fix" : "pass", detail: !kws.length ? `Add up to ${METADATA.keywordBoxes} keywords or short phrases.` : kws.length > METADATA.keywordBoxes ? `KDP allows ${METADATA.keywordBoxes}; you have ${kws.length}.` : kwIssues.length ? [...new Set(kwIssues)].join(" ") : `${kws.length} keyword${kws.length > 1 ? "s" : ""}, no issues found.`, how: "checked" });
  add({ id: "ls-cat", area: "Listing", label: "Categories", status: l.categories > 0 ? "pass" : "info", detail: l.categories > 0 ? `${l.categories} chosen. Confirm they're specific and fit the book.` : "Choose specific categories from the store's list when you upload.", how: "platform" });
  if (l.isbn.trim()) add({ id: "ls-isbn", area: "Listing", label: "ISBN", status: validIsbn(l.isbn) ? "pass" : "fix", detail: validIsbn(l.isbn) ? "Check digit is valid. Each format (eBook, paperback) needs its own ISBN if you use one." : "The ISBN's check digit doesn't match; re-check the number.", how: "checked" });
  else add({ id: "ls-isbn", area: "Listing", label: "ISBN", status: "info", detail: "Not given. Kindle eBooks don't need one; KDP can assign a free ISBN for paperbacks, or use your own (in Nigeria, from the National Library of Nigeria).", how: "person" });
  if ((l.format === "paperback" || l.format === "both") && l.pages != null) add({ id: "ls-pages", area: "Listing", label: "Paperback page count", status: l.pages < PRINT_COVER.minPages ? "fix" : "pass", detail: l.pages < PRINT_COVER.minPages ? `KDP paperbacks need at least ${PRINT_COVER.minPages} pages.` : `${l.pages} pages${l.pages < PRINT_COVER.spineTextMinPages ? ` — too thin for spine text (needs ${PRINT_COVER.spineTextMinPages}+).` : "."}`, how: "checked" });
  // ---- always human / platform
  add({ id: "hu-proof", area: "Manuscript", label: "Proofread", status: "info", detail: "Have someone other than the author proofread the final text. Software can't confirm this.", how: "person" });
  add({ id: "pl-preview", area: "Files", label: "Store previewer", status: "info", detail: "Open the files in the store's previewer (e.g. Kindle Previewer / KDP's print previewer) and page through them before publishing.", how: "platform" });
  add({ id: "pl-rights", area: "Listing", label: "Rights and territories", status: "info", detail: "Confirm you hold the rights to publish in the territories you select.", how: "person" });
  return out;
}

// ---------------------------------------------------------------- file inspection (browser)
export async function inspectEpub(bytes: Uint8Array): Promise<EpubFacts> {
  const { readZip } = await import("./zip");
  const entries = readZip(bytes);
  const names = entries.map((e) => e.name);
  const dec = new TextDecoder();
  const read = async (n: string) => { const e = entries.find((x) => x.name === n); return e ? dec.decode(await e.read()) : null; };
  const first = entries[0];
  const mimetypeFirst = !!first && first.name === "mimetype" && (await read("mimetype"))?.trim() === "application/epub+zip";
  const containerXml = await read("META-INF/container.xml");
  const p = new DOMParser();
  const opfPath = containerXml ? p.parseFromString(containerXml, "application/xml").querySelector("rootfile")?.getAttribute("full-path") ?? null : null;
  const opfXml = opfPath ? await read(opfPath) : null;
  const facts: EpubFacts = { mimetypeFirst, container: !!containerXml, opf: !!opfXml, nav: false, ncx: false, title: "", author: "", language: "", identifier: false, missingFiles: [], badXml: [], spineItems: 0, version: "?" };
  if (!opfXml || !opfPath) return facts;
  const opf = p.parseFromString(opfXml, "application/xml");
  const base = opfPath.includes("/") ? opfPath.slice(0, opfPath.lastIndexOf("/") + 1) : "";
  facts.version = opf.documentElement.getAttribute("version") ?? "?";
  const dc = (tag: string) => opf.getElementsByTagNameNS("http://purl.org/dc/elements/1.1/", tag)[0]?.textContent?.trim() ?? "";
  facts.title = dc("title"); facts.author = dc("creator"); facts.language = dc("language"); facts.identifier = !!dc("identifier");
  const items = Array.from(opf.getElementsByTagName("item"));
  facts.nav = items.some((i) => (i.getAttribute("properties") ?? "").split(/\s+/).includes("nav"));
  facts.ncx = items.some((i) => i.getAttribute("media-type") === "application/x-dtbncx+xml");
  facts.spineItems = opf.getElementsByTagName("itemref").length;
  for (const it of items) {
    const href = decodeURIComponent(it.getAttribute("href") ?? "");
    const full = (base + href).replace(/\/\.\//g, "/");
    if (!names.includes(full)) { facts.missingFiles.push(href); continue; }
    if (/xhtml|html/.test(it.getAttribute("media-type") ?? "") && facts.badXml.length < 10) {
      const x = await read(full);
      if (x && p.parseFromString(x, "application/xhtml+xml").getElementsByTagName("parsererror").length) facts.badXml.push(href);
    }
  }
  return facts;
}

/** Light PDF inspection from the raw bytes (no rendering): version, page count, sizes, encryption, embedded fonts. */
export function inspectPdf(bytes: Uint8Array): PdfFacts {
  const head = new TextDecoder("latin1").decode(bytes.subarray(0, 1024));
  const version = head.match(/%PDF-(\d\.\d)/)?.[1] ?? "?";
  const txt = new TextDecoder("latin1").decode(bytes.length > 40 * 1048576 ? bytes.subarray(0, 40 * 1048576) : bytes);
  const encrypted = /\/Encrypt\s+\d+\s+\d+\s+R/.test(txt);
  const counts = [...txt.matchAll(/\/Type\s*\/Pages\b[^>]*?\/Count\s+(\d+)/g)].map((m) => Number(m[1]));
  const pages = counts.length ? Math.max(...counts) : null;
  const sizes = new Set<string>();
  for (const m of txt.matchAll(/\/MediaBox\s*\[\s*([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s*\]/g)) {
    const w = (Number(m[3]) - Number(m[1])) / 72, h = (Number(m[4]) - Number(m[2])) / 72;
    sizes.add(`${w.toFixed(2)} × ${h.toFixed(2)} in`);
    if (sizes.size > 4) break;
  }
  // fonts: any font descriptor without FontFile/FontFile2/FontFile3 means not embedded (when streams aren't compressed into object streams)
  const descriptors = [...txt.matchAll(/\/Type\s*\/FontDescriptor([\s\S]{0,800}?)>>/g)].map((m) => m[1]);
  const fontsEmbedded = descriptors.length ? descriptors.every((d) => /\/FontFile[23]?\b/.test(d)) : null;
  return { version, pages, pageSizes: [...sizes], fontsEmbedded, encrypted };
}
