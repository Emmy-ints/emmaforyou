/**
 * Read a Word .docx into the book model, in the browser. Keeps all paragraph text, bold/italic,
 * headings (Title/Heading 1 start chapters; Heading 2/3 become sub-headings), lists, quotes and
 * page breaks. Reports — never silently drops — what it can't carry over (images, tables,
 * footnotes, comments, tracked changes).
 */
import { readZip } from "./zip";
import { type Block, type Chapter, type Run, mergeRuns, uuid, looksLikeChapterHeading, runsText } from "./manuscript";

export interface DocxImport { chapters: Chapter[]; title?: string; author?: string; notes: string[] }

const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

export async function importDocx(bytes: Uint8Array): Promise<DocxImport> {
  const entries = readZip(bytes);
  const get = (n: string) => entries.find((e) => e.name === n);
  const docEntry = get("word/document.xml");
  if (!docEntry) throw new Error("This file isn't a Word document (word/document.xml is missing). Save it as .docx and try again.");
  const dec = new TextDecoder();
  const xml = dec.decode(await docEntry.read());
  const stylesXml = get("word/styles.xml") ? dec.decode(await get("word/styles.xml")!.read()) : "";
  const coreXml = get("docProps/core.xml") ? dec.decode(await get("docProps/core.xml")!.read()) : "";
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");
  if (doc.getElementsByTagName("parsererror").length) throw new Error("The document's text couldn't be read (damaged XML).");

  // style id → { heading level, quote }
  const styleInfo = new Map<string, { level?: number; title?: boolean; quote?: boolean; list?: boolean }>();
  if (stylesXml) {
    const sd = parser.parseFromString(stylesXml, "application/xml");
    for (const s of Array.from(sd.getElementsByTagNameNS(W, "style"))) {
      const id = s.getAttributeNS(W, "styleId") ?? s.getAttribute("w:styleId") ?? "";
      const name = (s.getElementsByTagNameNS(W, "name")[0]?.getAttributeNS(W, "val") ?? "").toLowerCase();
      const outline = s.getElementsByTagNameNS(W, "outlineLvl")[0]?.getAttributeNS(W, "val");
      const info: { level?: number; title?: boolean; quote?: boolean; list?: boolean } = {};
      const hm = name.match(/^heading\s*(\d)/);
      if (hm) info.level = Number(hm[1]);
      else if (outline != null && /^\d$/.test(outline)) info.level = Number(outline) + 1;
      if (name === "title") info.title = true;
      if (/quote/.test(name)) info.quote = true;
      if (/list/.test(name)) info.list = true;
      styleInfo.set(id, info);
    }
  }
  const styleOf = (id: string) => styleInfo.get(id) ?? (/^heading(\d)$/i.test(id) ? { level: Number(id.replace(/\D/g, "")) } : /^title$/i.test(id) ? { title: true } : {});

  const notes = new Set<string>();
  const counts = { images: 0, tables: 0, footnotes: 0, comments: 0, deletions: 0 };
  const body = doc.getElementsByTagNameNS(W, "body")[0];
  if (!body) throw new Error("The document has no body text.");

  const chapters: Chapter[] = [];
  let cur: Chapter | null = null;
  const ensure = () => { if (!cur) { cur = { id: uuid(), title: chapters.length ? `Chapter ${chapters.length + 1}` : "Chapter 1", blocks: [] }; chapters.push(cur); } return cur; };
  let docTitle: string | undefined;
  let list: { ordered: boolean; items: Run[][]; numId: string } | null = null;
  const flushList = () => { if (list) { ensure().blocks.push({ t: "list", ordered: list.ordered, items: list.items }); list = null; } };

  const numFmt = new Map<string, boolean>(); // numId → ordered?
  const numberingEntry = get("word/numbering.xml");
  if (numberingEntry) {
    const nd = parser.parseFromString(dec.decode(await numberingEntry.read()), "application/xml");
    const abstractOrdered = new Map<string, boolean>();
    for (const a of Array.from(nd.getElementsByTagNameNS(W, "abstractNum"))) {
      const lvl0 = a.getElementsByTagNameNS(W, "lvl")[0];
      const fmt = lvl0?.getElementsByTagNameNS(W, "numFmt")[0]?.getAttributeNS(W, "val") ?? "bullet";
      abstractOrdered.set(a.getAttributeNS(W, "abstractNumId") ?? "", fmt !== "bullet" && fmt !== "none");
    }
    for (const n of Array.from(nd.getElementsByTagNameNS(W, "num"))) {
      const abs = n.getElementsByTagNameNS(W, "abstractNumId")[0]?.getAttributeNS(W, "val") ?? "";
      numFmt.set(n.getAttributeNS(W, "numId") ?? "", abstractOrdered.get(abs) ?? false);
    }
  }

  const readRuns = (p: Element): { runs: Run[]; pageBreak: boolean } => {
    const runs: Run[] = [];
    let pageBreak = false;
    const walk = (el: Element) => {
      for (const ch of Array.from(el.children)) {
        const ln = ch.localName;
        if (ln === "del" || ln === "moveFrom") { counts.deletions++; continue; } // tracked deletions aren't part of the text
        if (ln === "r") {
          const rPr = ch.getElementsByTagNameNS(W, "rPr")[0];
          const on = (tag: string) => { const e = rPr?.getElementsByTagNameNS(W, tag)[0]; if (!e) return false; const v = e.getAttributeNS(W, "val"); return v == null || !/^(0|false|none)$/i.test(v); };
          const b = on("b"), i = on("i");
          for (const rc of Array.from(ch.children)) {
            const n = rc.localName;
            if (n === "t") runs.push({ text: rc.textContent ?? "", b, i });
            else if (n === "tab") runs.push({ text: " ", b, i });
            else if (n === "br") { if (rc.getAttributeNS(W, "type") === "page") pageBreak = true; else runs.push({ text: " " }); }
            else if (n === "noBreakHyphen") runs.push({ text: "‑", b, i });
            else if (n === "sym") runs.push({ text: String.fromCharCode(parseInt(rc.getAttributeNS(W, "char") ?? "20", 16)) });
            else if (n === "drawing" || n === "pict" || n === "object") counts.images++;
            else if (n === "footnoteReference" || n === "endnoteReference") counts.footnotes++;
            else if (n === "commentReference") counts.comments++;
          }
        } else if (ln === "hyperlink" || ln === "ins" || ln === "smartTag" || ln === "sdt" || ln === "sdtContent" || ln === "fldSimple" || ln === "moveTo" || ln === "customXml") walk(ch);
      }
    };
    walk(p);
    return { runs: mergeRuns(runs.map((r) => ({ ...r, text: r.text.replace(/\s+/g, " ") }))), pageBreak };
  };

  const handleParagraph = (p: Element) => {
    const pPr = p.getElementsByTagNameNS(W, "pPr")[0];
    const sid = pPr?.getElementsByTagNameNS(W, "pStyle")[0]?.getAttributeNS(W, "val") ?? "";
    const st = styleOf(sid);
    const numPr = pPr?.getElementsByTagNameNS(W, "numPr")[0];
    const { runs, pageBreak } = readRuns(p);
    const text = runsText(runs).trim();
    if (!text) { if (!pageBreak) flushList(); return; }
    const trimmed = trimRuns(runs);
    if (st.title && !docTitle && !chapters.some((c) => c.blocks.length)) { docTitle = text; return; }
    if (st.level === 1 || (st.title && docTitle)) { flushList(); cur = { id: uuid(), title: text, blocks: [] }; chapters.push(cur); return; }
    if (st.level && st.level >= 2) { flushList(); ensure().blocks.push({ t: "h", level: st.level === 2 ? 2 : 3, runs: trimmed }); return; }
    if (numPr) {
      const numId = numPr.getElementsByTagNameNS(W, "numId")[0]?.getAttributeNS(W, "val") ?? "";
      const ordered = numFmt.get(numId) ?? false;
      if (!list || list.numId !== numId) { flushList(); list = { ordered, items: [], numId }; }
      list.items.push(trimmed);
      return;
    }
    flushList();
    const blk: Block = st.quote ? { t: "quote", runs: trimmed } : { t: "p", runs: trimmed };
    ensure().blocks.push(blk);
  };

  for (const el of Array.from(body.children)) {
    if (el.localName === "p") handleParagraph(el);
    else if (el.localName === "tbl") {
      counts.tables++;
      flushList();
      // keep table text as paragraphs (one per row, cells separated by " | ") so no words are lost
      for (const tr of Array.from(el.getElementsByTagNameNS(W, "tr"))) {
        const cells = Array.from(tr.getElementsByTagNameNS(W, "tc")).map((tc) => Array.from(tc.getElementsByTagNameNS(W, "p")).map((pp) => runsText(readRuns(pp).runs).trim()).filter(Boolean).join(" "));
        const line = cells.filter(Boolean).join(" | ");
        if (line) ensure().blocks.push({ t: "p", runs: [{ text: line }] });
      }
    } else if (el.localName === "sdt") {
      for (const p of Array.from(el.getElementsByTagNameNS(W, "p"))) handleParagraph(p);
    }
  }
  flushList();

  // No Heading 1 styles? Fall back to standalone "Chapter N" paragraphs.
  let out = chapters;
  if (chapters.length === 1) {
    const only = chapters[0];
    const idxs = only.blocks.map((b, i) => (b.t === "p" && looksLikeChapterHeading(runsText(b.runs)) ? i : -1)).filter((i) => i >= 0);
    if (idxs.length) {
      out = [];
      if (idxs[0] > 0) out.push({ id: uuid(), title: only.title, blocks: only.blocks.slice(0, idxs[0]) });
      idxs.forEach((start, k) => {
        const b = only.blocks[start] as { t: "p"; runs: Run[] };
        out.push({ id: uuid(), title: runsText(b.runs).trim(), blocks: only.blocks.slice(start + 1, idxs[k + 1] ?? only.blocks.length) });
      });
    } else notes.add("No Heading 1 styles or “Chapter …” lines were found, so the document is one chapter. Split it in the editor.");
  }
  if (!out.length) throw new Error("No text was found in this document.");

  if (counts.images) notes.add(`${counts.images} image${counts.images > 1 ? "s were" : " was"} not imported (text only). Add images to the final files with your publishing platform or ask us for help.`);
  if (counts.tables) notes.add(`${counts.tables} table${counts.tables > 1 ? "s were" : " was"} converted to plain lines of text (cells separated by “|”).`);
  if (counts.footnotes) notes.add(`${counts.footnotes} footnote/endnote reference${counts.footnotes > 1 ? "s were" : " was"} found; the note text itself isn't imported.`);
  if (counts.comments) notes.add("Comments in the document were ignored.");
  if (counts.deletions) notes.add("Tracked deletions were left out; tracked insertions were kept. Accept or reject changes in Word first if that's not what you want.");

  const core = coreXml ? parser.parseFromString(coreXml, "application/xml") : null;
  const t = core?.getElementsByTagName("dc:title")[0]?.textContent?.trim();
  const a = core?.getElementsByTagName("dc:creator")[0]?.textContent?.trim();
  return { chapters: out, title: docTitle || t || undefined, author: a || undefined, notes: [...notes] };
}

function trimRuns(runs: Run[]): Run[] {
  const r = runs.map((x) => ({ ...x }));
  while (r.length && !r[0].text.trim()) r.shift();
  while (r.length && !r[r.length - 1].text.trim()) r.pop();
  if (r.length) { r[0].text = r[0].text.replace(/^\s+/, ""); r[r.length - 1].text = r[r.length - 1].text.replace(/\s+$/, ""); }
  return mergeRuns(r);
}
