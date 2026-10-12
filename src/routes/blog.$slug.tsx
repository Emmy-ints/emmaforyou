import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { POSTS, getPost } from "@/lib/blog-data";
import { serviceForTopic } from "@/lib/topic-service";
import { pageHead, breadcrumbLd, articleLd, describe, withBrand, isoDate } from "@/lib/seo";

const WHATSAPP_URL = "https://wa.me/message/HHGMMWMRJFYUC1";

export const Route = createFileRoute("/blog/$slug")({
  component: BlogArticle,
  loader: ({ params }) => {
    const post = getPost(params.slug);
    if (!post) throw notFound();
    return { post };
  },
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-40 text-center">
        <h1 className="font-display text-3xl font-bold">Article not found</h1>
        <Link to="/blog" className="mt-4 inline-block text-sm underline">Back to blog</Link>
      </div>
    </div>
  ),
  head: ({ loaderData }) =>
    loaderData
      ? pageHead({
          title: withBrand(loaderData.post.title),
          description: describe(loaderData.post.excerpt, loaderData.post.body),
          path: `/blog/${loaderData.post.slug}`,
          type: "article",
          publishedTime: isoDate(loaderData.post.date),
          jsonLd: [
            breadcrumbLd([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }, { name: loaderData.post.title, path: `/blog/${loaderData.post.slug}` }]),
            articleLd({
              type: "BlogPosting",
              headline: loaderData.post.title,
              description: loaderData.post.excerpt,
              path: `/blog/${loaderData.post.slug}`,
              datePublished: isoDate(loaderData.post.date),
              authorName: loaderData.post.author.name,
              authorRole: loaderData.post.author.role,
              section: loaderData.post.category,
            }),
          ],
        })
      : { meta: [{ title: "Post not found — EmmaForYou" }, { name: "robots", content: "noindex" }] },
});

function BlogArticle() {
  const { post } = Route.useLoaderData();
  const related = POSTS.filter((p) => p.slug !== post.slug && p.category === post.category).slice(0, 3);
  const fallbackRelated = related.length ? related : POSTS.filter((p) => p.slug !== post.slug).slice(0, 3);

  const blocks = post.body.split(/\n\n+/);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-28 pb-24">
        {/* Hero */}
        <section
          className="relative flex min-h-[55vh] items-end overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${post.cover.from}, ${post.cover.to})` }}
        >
          <div className="absolute right-6 top-6 text-7xl opacity-30 md:text-9xl" aria-hidden>
            {post.cover.emoji}
          </div>
          <div className="relative mx-auto w-full max-w-4xl px-5 py-16">
            <Link to="/blog" className="text-xs font-semibold uppercase tracking-wider text-foreground/70 hover:text-foreground">
              ← Blog
            </Link>
            <span className="mt-4 inline-block rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-foreground">
              {post.category}
            </span>
            <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight text-foreground md:text-5xl">
              {post.title}
            </h1>
            <p className="mt-4 max-w-2xl text-base text-foreground/85 md:text-lg">{post.excerpt}</p>
            <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-foreground/80">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background font-bold">
                  {post.author.initials}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{post.author.name}</p>
                  <p className="text-xs">{post.author.role}</p>
                </div>
              </div>
              <span className="hidden md:inline">·</span>
              <span>{post.date}</span>
              <span>·</span>
              <span>📖 {post.read} read</span>
            </div>
          </div>
        </section>

        {/* Body */}
        <article className="mx-auto mt-12 max-w-3xl px-5">
          <div className="space-y-5 text-[1.05rem] leading-relaxed text-foreground">
            {blocks.map((b: string, i: number) => {
              const trimmed = b.trim();
              if (trimmed.startsWith("## ")) {
                return (
                  <h2 key={i} className="mt-10 font-display text-2xl font-bold md:text-3xl">
                    {trimmed.replace(/^##\s+/, "")}
                  </h2>
                );
              }
              if (/^\d+\.\s/.test(trimmed)) {
                return (
                  <ol key={i} className="ml-5 list-decimal space-y-2 marker:font-semibold">
                    {trimmed.split(/\n/).map((l: string, j: number) => (
                      <li key={j}>{renderInline(l.replace(/^\d+\.\s+/, ""))}</li>
                    ))}
                  </ol>
                );
              }
              if (trimmed.startsWith("- ") || trimmed.startsWith("> ")) {
                if (trimmed.startsWith("> ")) {
                  return (
                    <blockquote key={i} className="border-l-4 border-foreground/40 pl-4 italic text-muted-foreground">
                      {trimmed.replace(/^>\s+/gm, "")}
                    </blockquote>
                  );
                }
                return (
                  <ul key={i} className="ml-5 list-disc space-y-2">
                    {trimmed.split(/\n/).map((l: string, j: number) => (
                      <li key={j}>{renderInline(l.replace(/^-\s+/, ""))}</li>
                    ))}
                  </ul>
                );
              }
              return (
                <p key={i} className="leading-relaxed">
                  {renderInline(trimmed)}
                </p>
              );
            })}
          </div>

          {/* CTA */}
          <div className="mt-14 rounded-3xl p-1" style={{ background: "var(--gradient-brand)" }}>
            <div className="rounded-[22px] bg-card p-6 text-center md:p-8">
              <h3 className="font-display text-xl font-bold md:text-2xl">Want us to do this for you?</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                We help businesses across 3 continents implement everything you just read — and a lot more.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Link to={serviceForTopic(post.category).to} className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold hover:border-[color:var(--emma-violet)]">How our {serviceForTopic(post.category).label} service works</Link>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary-gradient inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white"
                >
                  Talk to a strategist on WhatsApp →
                </a>
              </div>
            </div>
          </div>

          {/* Related */}
          <div className="mt-16">
            <h3 className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Related articles
            </h3>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {fallbackRelated.map((r) => (
                <Link
                  key={r.slug}
                  to="/blog/$slug"
                  params={{ slug: r.slug }}
                  className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div
                    className="flex aspect-[16/10] items-center justify-center text-3xl"
                    style={{ background: `linear-gradient(135deg, ${r.cover.from}, ${r.cover.to})` }}
                    aria-hidden
                  >
                    {r.cover.emoji}
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {r.category}
                    </p>
                    <p className="mt-1 font-display text-sm font-bold leading-snug group-hover:text-emma-blue">
                      {r.title}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">{r.read} · {r.date}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}

function renderInline(text: string) {
  // bold support: **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>
  );
}
