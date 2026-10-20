import { createServerFn } from "@tanstack/react-start";

/**
 * Page metadata for the solutions catalogue, computed on the server. Route loaders and head() run in
 * the browser too, so calling findSolution()/ALL_SOLUTIONS there would put the whole catalogue (~190 KB
 * of text) in the main bundle for every page. Page components still import the catalogue, which keeps
 * it in the solutions pages' own chunks. Data modules are imported inside handlers (server only).
 */
const clean = (v: unknown, n: number) => String(v ?? "").slice(0, n);

export const getSolutionMeta = createServerFn({ method: "GET" })
  .inputValidator((d: { category: string; slug: string }) => ({ category: clean(d?.category, 80), slug: clean(d?.slug, 120) }))
  .handler(async ({ data }) => {
    const { findSolution, findCategory, solutionPath } = await import("./solutions");
    const { solutionDescription, solutionFaqs, solutionSeoTitle } = await import("./solutions/content");
    const s = findSolution(data.category, data.slug);
    const cat = s ? findCategory(s.category) : undefined;
    if (!s || !cat) return null;
    return {
      category: s.category,
      slug: s.slug,
      name: s.name,
      title: solutionSeoTitle(s),
      description: solutionDescription(s),
      path: solutionPath(s),
      serviceDescription: `${s.tagline} ${s.who}`,
      catName: cat.name,
      catSlug: cat.slug,
      faqs: solutionFaqs(s),
    };
  });

export const getSolutionCategoryMeta = createServerFn({ method: "GET" })
  .inputValidator((slug: string) => clean(slug, 80))
  .handler(async ({ data }) => {
    const { findCategory, solutionsIn } = await import("./solutions");
    const c = findCategory(data);
    if (!c) return null;
    return { slug: c.slug, name: c.name, intro: c.intro, items: solutionsIn(c.slug).map((s) => ({ name: s.name, slug: s.slug })) };
  });

export const getSolutionCount = createServerFn({ method: "GET" }).handler(async () => {
  const { ALL_SOLUTIONS } = await import("./solutions");
  return ALL_SOLUTIONS.length;
});
