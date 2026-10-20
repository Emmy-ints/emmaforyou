import { createServerFn } from "@tanstack/react-start";
import type { Article } from "./knowledge-data";

/**
 * Knowledge-base data is ~430 KB of article text. Route loaders run in the browser too, so reading
 * KNOWLEDGE directly in a loader or head() ships every article to every visitor on every page.
 * These server functions keep the text on the server: the browser only receives the article being
 * read (or the list without bodies). Data modules are imported inside the handlers, which are
 * stripped from the client bundle.
 */
export type ArticleSummary = Omit<Article, "body">;

const summary = ({ body: _body, ...meta }: Article): ArticleSummary => meta;

export const getKnowledgeArticle = createServerFn({ method: "GET" })
  .inputValidator((slug: string) => String(slug ?? "").slice(0, 160))
  .handler(async ({ data }) => {
    const { KNOWLEDGE } = await import("./knowledge-data");
    const article = KNOWLEDGE.find((a) => a.slug === data);
    if (!article) return null;
    const { POSTS } = await import("./blog-data");
    const related = KNOWLEDGE.filter((a) => a.category === article.category && a.slug !== article.slug).slice(0, 3).map(summary);
    return { article, related, sharesBlogTitle: POSTS.some((p) => p.title === article.title) };
  });

export const listKnowledge = createServerFn({ method: "GET" }).handler(async () => {
  const { KNOWLEDGE } = await import("./knowledge-data");
  return KNOWLEDGE.map(summary);
});
