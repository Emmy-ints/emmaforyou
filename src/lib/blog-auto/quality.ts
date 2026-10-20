import { similarity, tokens } from "./score";

/**
 * The publishing gate. An article is published only if every one of these 20 checks passes; the
 * full result is stored with the article (and with failed runs) so the dashboard can show exactly
 * why something was or wasn't published. Checks are deterministic: no AI judges its own work.
 */
export interface Draft { title: string; seo_title: string; excerpt: string; body: string }
export interface Evidence { url: string; title: string; publisher: string; published_at: string | null; text: string }
export interface Check { id: string; label: string; pass: boolean; detail?: string }

const words = (s: string) => s.replace(/[#*_`>[\]()!-]/g, " ").split(/\s+/).filter(Boolean).length;
const LINK_RE = /\[([^\]]+)\]\(([^)\s]+)\)/g;

export function links(body: string): { text: string; href: string }[] {
  return [...body.matchAll(LINK_RE)].map((m) => ({ text: m[1], href: m[2] }));
}

const norm = (s: string) => s.toLowerCase().replace(/[,\s]/g, "");

/** Figures that must be traceable to the evidence: percentages, money, and numbers of 4+ digits (not years). */
export function figures(body: string): string[] {
  const out = new Set<string>();
  const re = /(?:[$€£₦]\s?\d[\d,.]*\s?(?:k|m|bn|million|billion|thousand)?|\d[\d,.]*\s?%|\d[\d,.]*\s?(?:percent|million|billion)|\b\d{1,3}(?:,\d{3})+\b|\b\d{4,}\b)/gi;
  for (const m of body.replace(LINK_RE, "$1").matchAll(re)) {
    const f = m[0].trim();
    if (/^(19|20)\d{2}$/.test(f)) continue;
    out.add(f);
  }
  return [...out];
}

function figureInEvidence(f: string, evidence: string): boolean {
  const n = norm(f).replace(/percent$/, "%");
  const core = n.match(/\d[\d.]*/)?.[0] ?? n;
  if (evidence.includes(n)) return true;
  // Accept the same number with different formatting (e.g. "40%" vs "40 percent", "$2.5 billion" vs "$2.5bn").
  return new RegExp(`(^|[^\\d.])${core.replace(/\./g, "\\.")}($|[^\\d])`).test(evidence);
}

export function runQualityGate(d: Draft, ctx: { evidence: Evidence[]; validPaths: Set<string>; existingTitles: string[] }): { checks: Check[]; passed: number; ok: boolean } {
  const body = d.body.trim();
  const paragraphs = body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const h2 = paragraphs.filter((p) => p.startsWith("## "));
  const firstHeading = body.search(/^## /m);
  const intro = firstHeading > 0 ? body.slice(0, firstHeading) : "";
  const all = links(body);
  const internal = all.filter((l) => l.href.startsWith("/"));
  const external = all.filter((l) => /^https?:\/\//i.test(l.href));
  const sourceUrls = new Set(ctx.evidence.map((e) => e.url.replace(/\/$/, "")));
  const evidenceText = norm(ctx.evidence.map((e) => `${e.title} ${e.text}`).join(" "));
  const figs = figures(body);
  const untraced = figs.filter((f) => !figureInEvidence(f, evidenceText));
  const wc = words(body);
  const sentences = body.replace(/^#+ .*$/gm, "").split(/[.!?]+\s/).filter((s) => words(s) > 2);
  const avgSentence = sentences.length ? Math.round(sentences.reduce((a, s) => a + words(s), 0) / sentences.length) : 0;
  // Lists are measured per item; prose paragraphs as a whole.
  const units = paragraphs.filter((p) => !p.startsWith("#")).flatMap((p) => (/^(- |\d+\.\s)/.test(p) ? p.split("\n") : [p]));
  const longest = Math.max(0, ...units.map(words));
  const mostSimilar = ctx.existingTitles.reduce((best, t) => Math.max(best, similarity(d.title, t)), 0);
  const topicOverlap = ctx.evidence.length ? Math.max(...ctx.evidence.map((e) => similarity(`${d.title} ${d.excerpt}`, `${e.title} ${e.text.slice(0, 1500)}`))) : 0;
  const sharedWords = ctx.evidence.length ? [...tokens(d.title)].filter((w) => evidenceText.includes(w)).length : 0;
  const lastH2 = h2[h2.length - 1] ?? "";

  const checks: Check[] = [
    { id: "title_length", label: "Title is 30–110 characters", pass: d.title.length >= 30 && d.title.length <= 110, detail: `${d.title.length} characters` },
    { id: "seo_title", label: "SEO title is 65 characters or fewer", pass: d.seo_title.length > 10 && d.seo_title.length <= 65, detail: `${d.seo_title.length} characters` },
    { id: "excerpt", label: "Summary is 120–300 characters", pass: d.excerpt.length >= 120 && d.excerpt.length <= 300, detail: `${d.excerpt.length} characters` },
    { id: "length", label: "Article is 900–2,200 words", pass: wc >= 900 && wc <= 2200, detail: `${wc} words` },
    { id: "sections", label: "At least 3 sections", pass: h2.length >= 3, detail: `${h2.length} sections` },
    { id: "intro", label: "Opens with an introduction before the first heading", pass: words(intro) >= 40, detail: `${words(intro)} words` },
    { id: "closing", label: "Ends with a practical next-steps section", pass: /next|takeaway|bottom line|what to do|action|checklist|summary|where to start|getting started/i.test(lastH2), detail: lastH2.replace(/^## /, "") || "none" },
    { id: "format", label: "Uses only supported formatting (no HTML, tables or images)", pass: !/<[a-z][\s\S]*?>|^\s*\|.*\|\s*$|!\[/im.test(body) },
    { id: "internal_links", label: "Links to at least 2 EmmaForYou pages", pass: internal.length >= 2, detail: `${internal.length} links` },
    { id: "internal_valid", label: "Every internal link points to a real page", pass: internal.every((l) => ctx.validPaths.has(l.href.split(/[?#]/)[0].replace(/\/$/, "") || "/")), detail: internal.filter((l) => !ctx.validPaths.has(l.href.split(/[?#]/)[0].replace(/\/$/, "") || "/")).map((l) => l.href).join(", ") || undefined },
    { id: "external_sources_only", label: "External links go only to the cited sources", pass: external.every((l) => sourceUrls.has(l.href.replace(/\/$/, ""))), detail: external.filter((l) => !sourceUrls.has(l.href.replace(/\/$/, ""))).map((l) => l.href).join(", ") || undefined },
    { id: "cites_source", label: "Cites its source in the text", pass: external.length >= 1 },
    { id: "figures_traceable", label: "Every statistic appears in the source material", pass: untraced.length === 0, detail: untraced.length ? `Not found in sources: ${untraced.slice(0, 6).join(", ")}` : `${figs.length} figures checked` },
    { id: "no_placeholders", label: "No placeholders or AI boilerplate", pass: !/as an ai\b|language model|\[insert|lorem ipsum|\bTODO\b|\{\{|\bXX+\b|i cannot browse|knowledge cutoff/i.test(`${d.title} ${d.excerpt} ${body}`) },
    { id: "no_invented_clients", label: "No invented client stories or results", pass: !/\b(our|my) (client|customer)s?\b|\bwe helped\b|\bcase study\b/i.test(body) },
    { id: "no_guarantees", label: "No guaranteed outcomes", pass: !/\bguarantee(d|s)?\b|\b100% (success|results)\b|\bovernight success\b/i.test(`${d.title} ${body}`) },
    { id: "not_duplicate", label: "Not a near-duplicate of an existing article", pass: mostSimilar < 0.6, detail: `closest match ${(mostSimilar * 100).toFixed(0)}%` },
    { id: "on_topic", label: "About the same subject as its source", pass: topicOverlap >= 0.03 || sharedWords >= 2, detail: `${sharedWords} title words in sources` },
    { id: "paragraphs", label: "No paragraph or list item longer than 140 words", pass: longest <= 140, detail: `longest ${longest} words` },
    { id: "readable", label: "Average sentence is 28 words or fewer", pass: avgSentence > 0 && avgSentence <= 28, detail: `${avgSentence} words` },
  ];
  const passed = checks.filter((c) => c.pass).length;
  return { checks, passed, ok: passed === checks.length };
}
