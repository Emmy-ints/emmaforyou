import { createFileRoute } from "@tanstack/react-router";
import { SITE_URL } from "@/lib/seo";

/**
 * Crawler policy.
 * - Search and AI answer/search crawlers: allowed (the business wants to be found).
 * - AI training crawlers (GPTBot, ClaudeBot, Google-Extended, CCBot, Applebot-Extended): allowed by default.
 *   To opt out of training while staying in search, set BLOCK_AI_TRAINING to true.
 * - Private areas are disallowed for everyone. robots.txt is not access control:
 *   /dashboard and /portal are protected by login and marked noindex as well.
 */
const BLOCK_AI_TRAINING = false;
const PRIVATE = ["/dashboard", "/portal", "/api/"];
const TRAINING_BOTS = ["GPTBot", "ClaudeBot", "Google-Extended", "CCBot", "Applebot-Extended", "meta-externalagent", "cohere-ai"];

/** AI search and answer crawlers we explicitly welcome (each named group needs its own rules). */
const AI_SEARCH_BOTS = [
  "OAI-SearchBot", "ChatGPT-User", "PerplexityBot", "Perplexity-User", "Claude-SearchBot", "Claude-User",
  "Bingbot", "Googlebot", "Applebot", "DuckAssistBot", "YouBot", "Amazonbot", "MistralAI-User",
];

function body(): string {
  const lines: string[] = [];
  lines.push("# EmmaForYou — crawler policy", "# Search engines and AI assistants are welcome to read and cite public pages.", "");
  lines.push("User-agent: *", "Allow: /", ...PRIVATE.map((p) => `Disallow: ${p}`), "");
  for (const bot of AI_SEARCH_BOTS) lines.push(`User-agent: ${bot}`, "Allow: /", ...PRIVATE.map((p) => `Disallow: ${p}`), "");
  if (!BLOCK_AI_TRAINING) {
    for (const bot of TRAINING_BOTS) lines.push(`User-agent: ${bot}`, "Allow: /", ...PRIVATE.map((p) => `Disallow: ${p}`), "");
  }
  if (BLOCK_AI_TRAINING) {
    for (const bot of TRAINING_BOTS) lines.push(`User-agent: ${bot}`, "Disallow: /", "");
  }
  lines.push(`Sitemap: ${SITE_URL}/sitemap.xml`, `# AI summary: ${SITE_URL}/llms.txt (full: ${SITE_URL}/llms-full.txt)`, "");
  return lines.join("\n");
}

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: () => new Response(body(), { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } }),
    },
  },
});
