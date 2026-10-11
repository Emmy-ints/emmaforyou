import { z } from "zod";

export const prototypeRequestSchema = z.object({
  prompt: z.string().trim().min(8).max(500),
  refinement: z.string().trim().max(500).optional(),
  html: z.string().max(120000).optional(),
  language: z.enum(["en", "fr", "es", "de"]).default("en"),
}).refine((value) => !value.refinement || Boolean(value.html), { message: "A refinement needs an existing prototype." });

const CSP =
  `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; font-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'; object-src 'none'; frame-src 'none'">`;
const VIEWPORT = `<meta name="viewport" content="width=device-width,initial-scale=1">`;

/** Strip stray markdown fences the model may add around its HTML. */
export function cleanGeneratedHtml(html: string): string {
  return html.replace(/^\s*```(?:html)?\s*/i, "").replace(/```\s*$/, "").trim();
}

/**
 * Wrap generated markup so the restrictive CSP is always the very first thing in <head>,
 * whether the model returned a full document or just a fragment.
 */
export function previewDocument(html: string): string {
  const clean = cleanGeneratedHtml(html);
  if (/<head[\s>]/i.test(clean)) {
    const withCsp = clean.replace(/<head([^>]*)>/i, `<head$1>${CSP}`);
    return /name=["']viewport["']/i.test(withCsp) ? withCsp : withCsp.replace(/<head([^>]*)>/i, `<head$1>${VIEWPORT}`);
  }
  if (/<html[\s>]/i.test(clean)) {
    return clean.replace(/<html([^>]*)>/i, `<html$1><head>${CSP}${VIEWPORT}</head>`);
  }
  return `<!doctype html><html><head>${CSP}${VIEWPORT}</head><body>${clean}</body></html>`;
}
