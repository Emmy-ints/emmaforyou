/**
 * Word .docx export (Office Open XML). Uses real Word styles (Title, Subtitle, Heading 1–3,
 * Quote, List Paragraph, Normal), so the file stays editable and reformats cleanly in Word,
 * Google Docs or LibreOffice. Page size and margins follow the book settings; each chapter
 * starts on a new page when chosen. The Contents list is static text (Word users can replace it
 * with an automatic table of contents via References → Table of Contents).
 */
import { makeZip } from "./zip";
import { type Book, type Run, PAGE_SIZES, xmlEscape as x } from "./manuscript";
import { copyrightLines } from "./export-epub";
import { marginsFor } from "./layout";

const TWIP = 20; // twentieths of a point

function runXml(r: Run, extra = ""): string {
  const props = `${r.b ? "<w:b/>" : ""}${r.i ? "<w:i/>" : ""}${extra}`;
  return `<w:r>${props ? `<w:rPr>${props}</w:rPr>` : ""}<w:t xml:space="preserve">${x(r.text)}</w:t></w:r>`;
}
const para = (runs: Run[], style?: string, pPrExtra = "") =>
  `<w:p>${style || pPrExtra ? `<w:pPr>${style ? `<w:pStyle w:val="${style}"/>` : ""}${pPrExtra}</w:pPr>` : ""}${runs.map((r) => runXml(r)).join("")}</w:p>`;
const pageBreak = `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`;

export async function exportDocx(book: Book, when = new Date()): Promise<Uint8Array> {
  const { meta, chapters, settings } = book;
  const size = PAGE_SIZES[settings.pageSize];
  const m = marginsFor(book, 0);
  const lang = meta.language || "en";
  const body: string[] = [];

  body.push(para([{ text: meta.title }], "Title"));
  if (meta.subtitle) body.push(para([{ text: meta.subtitle }], "Subtitle"));
  body.push(para([{ text: meta.author }], "Author"));
  if (settings.includeCopyright) {
    body.push(pageBreak);
    for (const l of copyrightLines(book)) body.push(para([{ text: l }], "Copyright"));
  }
  if (meta.dedication?.trim()) { body.push(pageBreak); body.push(para([{ text: meta.dedication }], "Dedication")); }
  if (settings.includeToc && chapters.length > 1) {
    body.push(pageBreak);
    body.push(para([{ text: "Contents" }], "TOCHeading"));
    chapters.forEach((c, i) => body.push(`<w:p><w:pPr><w:pStyle w:val="TOC1"/></w:pPr><w:hyperlink w:anchor="ch${i + 1}" w:history="1">${runXml({ text: c.title || `Chapter ${i + 1}` }, '<w:rStyle w:val="Hyperlink"/>')}</w:hyperlink></w:p>`));
  }
  let numId = 0;
  const nums: { id: number; ordered: boolean }[] = [];
  chapters.forEach((c, i) => {
    const title = c.title.trim() || `Chapter ${i + 1}`;
    // Heading 1 carries pageBreakBefore when "each chapter on a new page" is on
    const pb = !settings.chapterNewPage && i === 0 ? pageBreak : "";
    body.push(`${pb}<w:p><w:pPr><w:pStyle w:val="Heading1"/>${settings.chapterNewPage ? "" : '<w:pageBreakBefore w:val="0"/>'}</w:pPr><w:bookmarkStart w:id="${i + 1}" w:name="ch${i + 1}"/>${runXml({ text: title })}<w:bookmarkEnd w:id="${i + 1}"/></w:p>`);
    let firstPara = true;
    for (const b of c.blocks) {
      if (b.t === "p") { body.push(para(b.runs, firstPara ? "FirstParagraph" : undefined)); firstPara = false; }
      else if (b.t === "h") { body.push(para(b.runs, b.level === 2 ? "Heading2" : "Heading3")); firstPara = true; }
      else if (b.t === "quote") body.push(para(b.runs, "Quote"));
      else if (b.t === "list") {
        numId++; nums.push({ id: numId, ordered: b.ordered });
        for (const it of b.items) body.push(para(it, "ListParagraph", `<w:numPr><w:ilvl w:val="0"/><w:numId w:val="${numId}"/></w:numPr>`));
      } else { body.push(para([{ text: "*   *   *" }], "SceneBreak")); firstPara = true; }
    }
  });

  const sect = `<w:sectPr><w:footerReference w:type="default" r:id="rIdFooter"/><w:pgSz w:w="${Math.round(size.w * TWIP)}" w:h="${Math.round(size.h * TWIP)}"/><w:pgMar w:top="${Math.round(m.top * TWIP)}" w:right="${Math.round(m.outer * TWIP)}" w:bottom="${Math.round(m.bottom * TWIP)}" w:left="${Math.round(m.inner * TWIP)}" w:header="${Math.round(m.top * TWIP * 0.5)}" w:footer="${Math.round(m.bottom * TWIP * 0.45)}" w:gutter="0"/><w:titlePg/></w:sectPr>`;
  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>${body.join("")}${sect}</w:body></w:document>`;

  const fs = settings.fontSize * 2; // half-points
  const line = Math.round(settings.lineHeight * 240);
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Georgia" w:hAnsi="Georgia" w:eastAsia="Georgia" w:cs="Georgia"/><w:sz w:val="${fs}"/><w:szCs w:val="${fs}"/><w:lang w:val="${x(lang)}"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="${line}" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/><w:pPr><w:ind w:firstLine="${Math.round(settings.fontSize * 1.5 * TWIP)}"/>${settings.justify ? '<w:jc w:val="both"/>' : ""}<w:widowControl/></w:pPr></w:style>
<w:style w:type="paragraph" w:customStyle="1" w:styleId="FirstParagraph"><w:name w:val="First Paragraph"/><w:basedOn w:val="Normal"/><w:pPr><w:ind w:firstLine="0"/></w:pPr></w:style>
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:before="${Math.round(size.h * 0.22 * TWIP)}" w:after="240"/><w:ind w:firstLine="0"/><w:jc w:val="center"/></w:pPr><w:rPr><w:b/><w:sz w:val="${fs * 2 + 8}"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="600"/><w:ind w:firstLine="0"/><w:jc w:val="center"/></w:pPr><w:rPr><w:i/><w:sz w:val="${fs + 8}"/></w:rPr></w:style>
<w:style w:type="paragraph" w:customStyle="1" w:styleId="Author"><w:name w:val="Author"/><w:basedOn w:val="Normal"/><w:pPr><w:ind w:firstLine="0"/><w:jc w:val="center"/></w:pPr><w:rPr><w:sz w:val="${fs + 6}"/></w:rPr></w:style>
<w:style w:type="paragraph" w:customStyle="1" w:styleId="Copyright"><w:name w:val="Copyright"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="80"/><w:ind w:firstLine="0"/><w:jc w:val="left"/></w:pPr><w:rPr><w:sz w:val="${Math.max(14, fs - 4)}"/></w:rPr></w:style>
<w:style w:type="paragraph" w:customStyle="1" w:styleId="Dedication"><w:name w:val="Dedication"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="${Math.round(size.h * 0.25 * TWIP)}"/><w:ind w:firstLine="0"/><w:jc w:val="center"/></w:pPr><w:rPr><w:i/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="TOCHeading"><w:name w:val="TOC Heading"/><w:basedOn w:val="Heading1"/><w:next w:val="Normal"/><w:pPr><w:pageBreakBefore w:val="0"/><w:outlineLvl w:val="9"/></w:pPr></w:style>
<w:style w:type="paragraph" w:styleId="TOC1"><w:name w:val="toc 1"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="100"/><w:ind w:firstLine="0"/><w:jc w:val="left"/></w:pPr></w:style>
<w:style w:type="character" w:styleId="Hyperlink"><w:name w:val="Hyperlink"/><w:rPr><w:color w:val="1F3B8C"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="FirstParagraph"/><w:qFormat/><w:pPr><w:keepNext/>${settings.chapterNewPage ? "<w:pageBreakBefore/>" : ""}<w:spacing w:before="${settings.chapterNewPage ? Math.round(size.h * 0.18 * TWIP) : 600}" w:after="480"/><w:ind w:firstLine="0"/><w:jc w:val="center"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:sz w:val="${fs + 14}"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="FirstParagraph"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="360" w:after="120"/><w:ind w:firstLine="0"/><w:jc w:val="left"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:sz w:val="${fs + 6}"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:next w:val="FirstParagraph"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="240" w:after="80"/><w:ind w:firstLine="0"/><w:jc w:val="left"/><w:outlineLvl w:val="2"/></w:pPr><w:rPr><w:b/><w:i/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Quote"><w:name w:val="Quote"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:before="160" w:after="160"/><w:ind w:left="720" w:right="720" w:firstLine="0"/></w:pPr><w:rPr><w:i/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:ind w:left="720" w:hanging="360" w:firstLine="0"/><w:jc w:val="left"/></w:pPr></w:style>
<w:style w:type="paragraph" w:customStyle="1" w:styleId="SceneBreak"><w:name w:val="Scene Break"/><w:basedOn w:val="Normal"/><w:next w:val="FirstParagraph"/><w:pPr><w:spacing w:before="200" w:after="200"/><w:ind w:firstLine="0"/><w:jc w:val="center"/></w:pPr></w:style>
<w:style w:type="paragraph" w:styleId="Footer"><w:name w:val="footer"/><w:basedOn w:val="Normal"/><w:pPr><w:ind w:firstLine="0"/><w:jc w:val="center"/></w:pPr><w:rPr><w:sz w:val="${Math.max(14, fs - 4)}"/></w:rPr></w:style>
</w:styles>`;

  const numbering = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="singleLevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl></w:abstractNum>
<w:abstractNum w:abstractNumId="1"><w:multiLevelType w:val="singleLevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl></w:abstractNum>
${nums.map((n) => `<w:num w:numId="${n.id}"><w:abstractNumId w:val="${n.ordered ? 1 : 0}"/>${n.ordered ? '<w:lvlOverride w:ilvl="0"><w:startOverride w:val="1"/></w:lvlOverride>' : ""}</w:num>`).join("\n")}
</w:numbering>`;

  const footer = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:pPr><w:pStyle w:val="Footer"/></w:pPr><w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>1</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p></w:ftr>`;

  const iso = when.toISOString().replace(/\.\d{3}Z$/, "Z");
  const files = [
    { name: "[Content_Types].xml", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>` },
    { name: "_rels/.rels", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>` },
    { name: "word/_rels/document.xml.rels", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rIdSettings" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/><Relationship Id="rIdNumbering" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/><Relationship Id="rIdFooter" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/></Relationships>` },
    { name: "word/document.xml", data: document },
    { name: "word/styles.xml", data: styles },
    { name: "word/numbering.xml", data: numbering },
    { name: "word/footer1.xml", data: footer },
    { name: "word/settings.xml", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">${settings.mirrorMargins && size.print ? "<w:mirrorMargins/>" : ""}<w:defaultTabStop w:val="720"/><w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat></w:settings>` },
    { name: "docProps/core.xml", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${x(meta.title)}</dc:title><dc:creator>${x(meta.author)}</dc:creator><dc:language>${x(lang)}</dc:language>${meta.description ? `<dc:description>${x(meta.description)}</dc:description>` : ""}<dcterms:created xsi:type="dcterms:W3CDTF">${iso}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${iso}</dcterms:modified></cp:coreProperties>` },
    { name: "docProps/app.xml", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>EmmaForYou eBook Creator</Application></Properties>` },
  ];
  return makeZip(files, when);
}
