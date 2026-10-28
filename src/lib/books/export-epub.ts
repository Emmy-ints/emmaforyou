/**
 * EPUB 3 export (with an EPUB 2 toc.ncx for older readers). Structure:
 *   mimetype (first, uncompressed) · META-INF/container.xml · OEBPS/content.opf · nav.xhtml ·
 *   toc.ncx · styles.css · cover/title/copyright/dedication pages · one XHTML file per chapter.
 * Reflowable text only; the reader app controls fonts and page size.
 */
import { makeZip, type ZipInput } from "./zip";
import { type Book, type Block, type Run, xmlEscape as x } from "./manuscript";

export interface EpubOptions { cover?: { bytes: Uint8Array; type: "image/jpeg" | "image/png" }; modified?: Date }

const CSS = `body{margin:0 5%;font-family:serif;line-height:1.5;text-align:justify;hyphens:auto;-webkit-hyphens:auto}
h1{font-size:1.6em;text-align:center;margin:3em 0 1.5em;page-break-before:always;break-before:page;line-height:1.25}
h2{font-size:1.25em;margin:1.6em 0 .6em;text-align:left}h3{font-size:1.05em;margin:1.4em 0 .5em}
p{margin:0;text-indent:1.4em}p.first,h1+p,h2+p,h3+p,hr+p,blockquote+p,ul+p,ol+p{text-indent:0}
blockquote{margin:1em 1.5em;font-style:italic}blockquote p{text-indent:0}
hr.scene{border:0;margin:1.2em 0;text-align:center;height:1em}hr.scene:after{content:"* * *";letter-spacing:.4em}
ul,ol{margin:.8em 0 .8em 1.5em;padding:0}li{margin:.2em 0}
.titlepage{text-align:center;margin-top:30%}.titlepage h1{page-break-before:auto;margin:0 0 .4em;font-size:2em}
.subtitle{font-size:1.15em;font-style:italic;margin:0 0 3em;text-indent:0}.author{font-size:1.2em;text-indent:0}
.copyright{font-size:.85em;margin-top:40%}.copyright p{text-indent:0;margin:.4em 0}
.dedication{text-align:center;font-style:italic;margin-top:30%}.dedication p{text-indent:0}
.cover{margin:0;padding:0;text-align:center}.cover img{max-width:100%;max-height:100%}
nav ol{list-style:none;margin-left:0}nav li{margin:.4em 0}`;

export function runsHtml(runs: Run[]): string {
  return runs.map((r) => {
    let s = x(r.text);
    if (r.i) s = `<em>${s}</em>`;
    if (r.b) s = `<strong>${s}</strong>`;
    return s;
  }).join("");
}

export function blocksHtml(blocks: Block[]): string {
  let first = true;
  return blocks.map((b) => {
    let s = "";
    if (b.t === "p") { s = `<p${first ? ' class="first"' : ""}>${runsHtml(b.runs)}</p>`; first = false; }
    else if (b.t === "h") { s = `<h${b.level}>${runsHtml(b.runs)}</h${b.level}>`; first = true; }
    else if (b.t === "quote") s = `<blockquote><p>${runsHtml(b.runs)}</p></blockquote>`;
    else if (b.t === "list") s = `<${b.ordered ? "ol" : "ul"}>${b.items.map((it) => `<li>${runsHtml(it)}</li>`).join("")}</${b.ordered ? "ol" : "ul"}>`;
    else { s = `<hr class="scene"/>`; first = true; }
    return s;
  }).join("\n");
}

const page = (lang: string, title: string, body: string, extraNs = "") =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE html>\n<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"${extraNs} xml:lang="${x(lang)}" lang="${x(lang)}">\n<head><meta charset="UTF-8"/><title>${x(title)}</title><link rel="stylesheet" type="text/css" href="styles.css"/></head>\n<body>\n${body}\n</body>\n</html>\n`;

export async function exportEpub(book: Book, opts: EpubOptions = {}): Promise<Uint8Array> {
  const { meta, chapters, settings } = book;
  const lang = meta.language || "en";
  const modified = (opts.modified ?? new Date()).toISOString().replace(/\.\d{3}Z$/, "Z");
  const files: ZipInput[] = [
    { name: "mimetype", data: "application/epub+zip", store: true },
    { name: "META-INF/container.xml", data: `<?xml version="1.0" encoding="UTF-8"?>\n<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>\n` },
    { name: "OEBPS/styles.css", data: CSS },
  ];
  const manifest: string[] = [
    `<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>`,
    `<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>`,
    `<item id="css" href="styles.css" media-type="text/css"/>`,
  ];
  const spine: string[] = [];
  const add = (id: string, href: string, html: string, linear = true) => {
    files.push({ name: `OEBPS/${href}`, data: html });
    manifest.push(`<item id="${id}" href="${href}" media-type="application/xhtml+xml"/>`);
    spine.push(`<itemref idref="${id}"${linear ? "" : ' linear="no"'}/>`);
  };

  if (opts.cover) {
    const ext = opts.cover.type === "image/png" ? "png" : "jpg";
    files.push({ name: `OEBPS/cover.${ext}`, data: opts.cover.bytes, store: true });
    manifest.push(`<item id="cover-image" href="cover.${ext}" media-type="${opts.cover.type}" properties="cover-image"/>`);
    add("cover", "cover.xhtml", page(lang, "Cover", `<section class="cover" epub:type="cover"><img src="cover.${ext}" alt="${x(`Cover of ${meta.title}`)}"/></section>`));
  }
  add("titlepage", "title.xhtml", page(lang, meta.title, `<section class="titlepage" epub:type="titlepage"><h1>${x(meta.title)}</h1>${meta.subtitle ? `<p class="subtitle">${x(meta.subtitle)}</p>` : ""}<p class="author">${x(meta.author)}</p>${meta.publisher ? `<p class="author">${x(meta.publisher)}</p>` : ""}</section>`));
  if (settings.includeCopyright) add("copyright", "copyright.xhtml", page(lang, "Copyright", `<section class="copyright" epub:type="copyright-page">${copyrightLines(book).map((l) => `<p>${x(l)}</p>`).join("")}</section>`));
  if (meta.dedication?.trim()) add("dedication", "dedication.xhtml", page(lang, "Dedication", `<section class="dedication" epub:type="dedication"><p>${x(meta.dedication)}</p></section>`));

  const navItems: string[] = []; const ncx: string[] = [];
  chapters.forEach((c, i) => {
    const href = `chapter-${String(i + 1).padStart(3, "0")}.xhtml`;
    const title = c.title.trim() || `Chapter ${i + 1}`;
    add(`ch${i + 1}`, href, page(lang, title, `<section epub:type="chapter" id="ch${i + 1}"><h1>${x(title)}</h1>\n${blocksHtml(c.blocks)}</section>`));
    navItems.push(`<li><a href="${href}">${x(title)}</a></li>`);
    ncx.push(`<navPoint id="np${i + 1}" playOrder="${i + 1}"><navLabel><text>${x(title)}</text></navLabel><content src="${href}"/></navPoint>`);
  });

  const landmarks = [`<li><a epub:type="titlepage" href="title.xhtml">Title page</a></li>`, chapters.length ? `<li><a epub:type="bodymatter" href="chapter-001.xhtml">Start of content</a></li>` : ""].join("");
  files.push({ name: "OEBPS/nav.xhtml", data: page(lang, "Contents", `<nav epub:type="toc" id="toc"><h1>Contents</h1><ol>${navItems.join("")}</ol></nav>\n<nav epub:type="landmarks" hidden="hidden"><ol>${landmarks}</ol></nav>`) });
  // Contents page in reading order (after front matter) when requested; nav.xhtml always exists for readers' menus.
  if (settings.includeToc) {
    const navIdx = spine.findIndex((s) => s.includes('"ch1"'));
    spine.splice(navIdx < 0 ? spine.length : navIdx, 0, `<itemref idref="nav"/>`);
  }
  files.push({ name: "OEBPS/toc.ncx", data: `<?xml version="1.0" encoding="UTF-8"?>\n<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1" xml:lang="${x(lang)}"><head><meta name="dtb:uid" content="${x(meta.identifier)}"/><meta name="dtb:depth" content="1"/><meta name="dtb:totalPageCount" content="0"/><meta name="dtb:maxPageNumber" content="0"/></head><docTitle><text>${x(meta.title)}</text></docTitle><docAuthor><text>${x(meta.author)}</text></docAuthor><navMap>${ncx.join("")}</navMap></ncx>\n` });

  const md: string[] = [
    `<dc:identifier id="bookid">${x(meta.identifier)}</dc:identifier>`,
    `<dc:title id="t-main">${x(meta.title)}</dc:title>`,
    `<meta refines="#t-main" property="title-type">main</meta>`,
    ...(meta.subtitle ? [`<dc:title id="t-sub">${x(meta.subtitle)}</dc:title>`, `<meta refines="#t-sub" property="title-type">subtitle</meta>`] : []),
    `<dc:creator id="author">${x(meta.author)}</dc:creator>`,
    `<meta refines="#author" property="role" scheme="marc:relators">aut</meta>`,
    `<dc:language>${x(lang)}</dc:language>`,
    `<meta property="dcterms:modified">${modified}</meta>`,
  ];
  if (meta.publisher) md.push(`<dc:publisher>${x(meta.publisher)}</dc:publisher>`);
  if (meta.description) md.push(`<dc:description>${x(meta.description)}</dc:description>`);
  if (meta.isbn) md.push(`<dc:source>urn:isbn:${x(meta.isbn.replace(/[\s-]/g, ""))}</dc:source>`);
  if (meta.rights || meta.year) md.push(`<dc:rights>${x(meta.rights || `© ${meta.year} ${meta.author}`)}</dc:rights>`);
  if (opts.cover) md.push(`<meta name="cover" content="cover-image"/>`);
  files.splice(3, 0, {
    name: "OEBPS/content.opf",
    data: `<?xml version="1.0" encoding="UTF-8"?>\n<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid" xml:lang="${x(lang)}">\n<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">\n${md.join("\n")}\n</metadata>\n<manifest>\n${manifest.join("\n")}\n</manifest>\n<spine toc="ncx">\n${spine.join("\n")}\n</spine>\n</package>\n`,
  });
  return makeZip(files);
}

export function copyrightLines(book: Book): string[] {
  const { meta } = book;
  const year = meta.year || String(new Date().getFullYear());
  const lines = [meta.rights?.trim() || `Copyright © ${year} ${meta.author}`, "All rights reserved."];
  if (meta.isbn) lines.push(`ISBN ${meta.isbn}`);
  if (meta.publisher) lines.push(`Published by ${meta.publisher}`);
  return lines;
}
