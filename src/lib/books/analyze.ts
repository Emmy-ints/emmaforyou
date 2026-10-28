/**
 * Measured statistics for a manuscript sample. Every figure is counted from the text with the
 * formula shown in the UI; nothing is a quality "score". Readability formulas are designed for
 * English; for other languages only the counts are shown.
 */
export interface Sentence { text: string; words: number; start: number }
export interface Analysis {
  words: number; sentences: number; paragraphs: number; syllables: number;
  avgSentence: number; avgWordLen: number;
  fleschEase: number | null; fkGrade: number | null; // English only
  longSentences: Sentence[]; // > 35 words
  passive: { text: string; count: number }; // "possible passive" heuristic
  adverbs: { count: number; per1000: number; top: [string, number][] };
  repeated: [string, number][]; // content words used unusually often
  dialogueShare: number; // share of words inside quotation marks
  paragraphs_long: number; // > 250 words
  opening: { words: number; firstSentence: string; startsWith: "dialogue" | "action/description" | "exposition"; question: boolean };
  readingMinutes: number;
}

const STOP = new Set("a an the and or but if then so to of in on at by for with from as is are was were be been being it its this that these those he she they we you i me my our your their his her them us not no yes do does did have has had will would can could should may might must there here what which who whom whose when where why how all any each few more most other some such only own same than too very just also into over under again further once about against between through during before after above below up down out off".split(" "));

export function syllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const m = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "").match(/[aeiouy]{1,2}/g);
  return Math.max(1, m ? m.length : 1);
}

export function splitSentences(text: string): Sentence[] {
  const out: Sentence[] = [];
  const re = /[^.!?…]+(?:[.!?…]+["”’)\]]*|$)/g;
  let m: RegExpExecArray | null;
  const t = text.replace(/\s+/g, " ");
  while ((m = re.exec(t))) {
    const s = m[0].trim();
    if (!s) continue;
    const words = (s.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) ?? []).length;
    if (!words) continue;
    // join abbreviations like "Mr." "Dr." "e.g." with the next sentence
    const prev = out[out.length - 1];
    if (prev && /\b(Mr|Mrs|Ms|Dr|St|Prof|Sr|Jr|vs|etc|e\.g|i\.e)\.$/i.test(prev.text)) { prev.text += ` ${s}`; prev.words += words; continue; }
    out.push({ text: s, words, start: m.index });
  }
  return out;
}

export function analyze(text: string, lang = "en"): Analysis {
  const clean = text.replace(/\r\n?/g, "\n");
  const paras = clean.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const wordsArr = clean.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) ?? [];
  const words = wordsArr.length;
  const sents = splitSentences(clean);
  const sentences = Math.max(1, sents.length);
  const english = /^en\b/i.test(lang);
  const syl = english ? wordsArr.reduce((a, w) => a + syllables(w), 0) : 0;
  const wps = words / sentences;
  const spw = words ? syl / words : 0;
  const fleschEase = english && words >= 100 ? round(206.835 - 1.015 * wps - 84.6 * spw, 1) : null;
  const fkGrade = english && words >= 100 ? round(0.39 * wps + 11.8 * spw - 15.59, 1) : null;

  const passiveRe = /\b(am|is|are|was|were|be|been|being)\s+(\w+ly\s+)?(\w+(ed|en)|made|done|seen|given|taken|known|told|found|left|held|kept|brought|built|caught|written|shown|thrown)\b/gi;
  const passiveHits = clean.match(passiveRe) ?? [];
  const adv = new Map<string, number>();
  for (const w of wordsArr) { const l = w.toLowerCase(); if (l.length > 4 && l.endsWith("ly") && !["only", "family", "early", "reply", "supply", "belly", "fly", "holy", "ugly", "july", "italy", "lovely", "friendly", "lonely", "silly", "rally", "jelly", "bully", "lily", "sally", "billy", "apply", "ally", "daily", "likely", "elderly", "costly", "lively", "orderly", "deadly", "kindly"].includes(l)) adv.set(l, (adv.get(l) ?? 0) + 1); }
  const advCount = [...adv.values()].reduce((a, b) => a + b, 0);
  const freq = new Map<string, number>();
  for (const w of wordsArr) { const l = w.toLowerCase().replace(/['’]s$/, ""); if (l.length > 3 && !STOP.has(l) && !/^\d+$/.test(l)) freq.set(l, (freq.get(l) ?? 0) + 1); }
  const threshold = Math.max(6, words / 400);
  const repeated = [...freq.entries()].filter(([, n]) => n >= threshold).sort((a, b) => b[1] - a[1]).slice(0, 12);
  let inQuote = 0;
  for (const m of clean.matchAll(/[“"]([^”"]{1,2000})[”"]/g)) inQuote += (m[1].match(/[\p{L}\p{N}]+/gu) ?? []).length;
  const first = sents[0]?.text ?? "";
  const firstPara = paras[0] ?? "";
  return {
    words, sentences: sents.length, paragraphs: paras.length, syllables: syl,
    avgSentence: round(wps, 1), avgWordLen: round(words ? wordsArr.reduce((a, w) => a + w.length, 0) / words : 0, 1),
    fleschEase, fkGrade,
    longSentences: sents.filter((s) => s.words > 35).slice(0, 15),
    passive: { text: "possible passive constructions (a form of “to be” + past participle)", count: passiveHits.length },
    adverbs: { count: advCount, per1000: round(words ? (advCount / words) * 1000 : 0, 1), top: [...adv.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8) },
    repeated,
    dialogueShare: words ? round((inQuote / words) * 100, 0) : 0,
    paragraphs_long: paras.filter((p) => (p.match(/[\p{L}\p{N}]+/gu) ?? []).length > 250).length,
    opening: {
      words: (firstPara.match(/[\p{L}\p{N}]+/gu) ?? []).length,
      firstSentence: first.slice(0, 300),
      startsWith: /^[“"']/.test(first) ? "dialogue" : /\b(ran|grabbed|slammed|fell|screamed|turned|opened|pulled|pushed|woke|died|hit|shot|jumped|stopped)\b/i.test(first) ? "action/description" : "exposition",
      question: /\?\s*["”]?$/.test(first),
    },
    readingMinutes: Math.max(1, Math.round(words / 238)),
  };
}

export function easeLabel(v: number | null): string {
  if (v == null) return "Not calculated (needs English text of 100+ words)";
  if (v >= 80) return "very easy to read";
  if (v >= 60) return "plain English — easy for most adults";
  if (v >= 50) return "fairly difficult";
  if (v >= 30) return "difficult (typical of academic writing)";
  return "very difficult";
}
const round = (n: number, d: number) => Math.round(n * 10 ** d) / 10 ** d;
