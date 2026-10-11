import { z } from "zod";

export const prototypeRequestSchema = z.object({
  prompt: z.string().trim().min(8).max(500),
  refinement: z.string().trim().max(500).optional(),
  html: z.string().max(120000).optional(),
  language: z.enum(["en", "fr", "es", "de"]).default("en"),
}).refine((value) => !value.refinement || Boolean(value.html), { message: "A refinement needs an existing prototype." });

export function previewDocument(html: string): string {
  const clean = html.replace(/^\s*```(?:html)?\s*/i, "").replace(/```\s*$/, "");
  const policy = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; font-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'; object-src 'none'; frame-src 'none'">`;
  // CSP is first, even if generated markup has a malformed/missing head.
  return `<!doctype html><html><head>${policy}<meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${clean}</body></html>`;
}