import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { KineticText } from "@/components/future/Kinetic";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getBlogPost } from "@/lib/blog-server";
import { serviceForTopic } from "@/lib/topic-service";
import { pageHead, breadcrumbLd, articleLd, describe, withBrand, isoDate } from "@/lib/seo";

const WHATSAPP_URL = "https://wa.me/message/HHGMMWMRJFYUC1";

export const Route = createFileRoute("/blog/$slug")({
  component: BlogArticle,
  loader: async ({ params }) => {
    const found = await getBlogPost({ data: params.slug });
    if (!found) throw notFound();
    return found;
  },
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-40 text-center">
        <h1 className="font-display text-3xl font-bold"><KineticText text="Article not found" base={60} /></h1>
        <Link to="/blog" className="mt-4 inline-block text-sm underline">Back to blog</Link>
      </div>
    </div>
  ),
  head: ({ loaderData }) =>
    loaderData
      ? pageHead({
          title: withBrand(loaderData.post.seoTitle || loaderData.post.title),
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
  const { post, related: fallbackRelated } = Route.useLoaderData();

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
              if (trimmed.startsWith("### ")) {
                return (
                  <h3 key={i} className="mt-8 font-display text-xl font-bold md:text-2xl">
                    {trimmed.replace(/^###\s+/, "")}
                  </h3>
                );
              }
              if (trimmed.startsWith("!> ")) {
                return (
                  <aside key={i} className="rounded-2xl border border-[color:var(--emma-violet)]/30 bg-[color:var(--emma-violet)]/5 p-5 text-[0.98rem]">
                    {renderInline(trimmed.replace(/^!>\s+/gm, ""))}
                  </aside>
                );
              }
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

          {post.sources && post.sources.length > 0 && (
            <section aria-labelledby="sources-h" className="mt-12 rounded-2xl border border-border bg-card p-5 md:p-6">
              <h2 id="sources-h" className="font-display text-lg font-bold"><KineticText text="Sources" base={30} /></h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
                {post.sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-medium text-foreground underline decoration-border underline-offset-2 hover:decoration-[color:var(--emma-violet)]">{s.title}</a>
                    <span className="text-muted-foreground"> — {s.publisher}{s.published_at ? `, ${new Date(s.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}` : ""}</span>
                  </li>
                ))}
              </ol>
              {post.automated && <p className="mt-4 text-xs text-muted-foreground">This article was drafted with AI from the sources above, then published only after passing 20 automated checks: every figure must appear in the sources, links must work, and nothing may be invented. Spotted an error? <Link to="/contact" className="underline">Tell us</Link> and we'll correct it.</p>}
            </section>
          )}

          {post.tool && (
            <div className="mt-12 flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--emma-violet)]">Free tool</p>
                <p className="mt-1 font-display text-lg font-bold">{post.tool.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">{post.tool.text}</p>
              </div>
              <Link to={post.tool.to} className="btn-primary-gradient inline-flex shrink-0 items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white">Try it free →</Link>
            </div>
          )}

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
  // **bold** and [label](/internal-path or https://external)
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\))/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) return <strong key={i}>{p.slice(2, -2)}</strong>;
    const link = p.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
    if (link) {
      const [, label, href] = link;
      const cls = "font-semibold text-[color:var(--emma-violet)] underline decoration-[color:var(--emma-violet)]/30 underline-offset-4 hover:decoration-[color:var(--emma-violet)]";
      return href.startsWith("/")
        ? <Link key={i} to={href} className={cls}>{label}</Link>
        : <a key={i} href={href} target="_blank" rel="noopener noreferrer" className={cls}>{label}</a>;
    }
    return <span key={i}>{p}</span>;
  });
}
