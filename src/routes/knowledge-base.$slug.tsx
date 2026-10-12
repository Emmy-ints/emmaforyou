import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { KNOWLEDGE } from "@/lib/knowledge-data";
import { supabase } from "@/integrations/supabase/client";
import { buildWa } from "@/lib/leads";
import { serviceForTopic } from "@/lib/topic-service";
import { pageHead, breadcrumbLd, articleLd, clip } from "@/lib/seo";

export const Route = createFileRoute("/knowledge-base/$slug")({
  component: ArticlePage,
  loader: ({ params }) => {
    const article = KNOWLEDGE.find((a) => a.slug === params.slug);
    if (!article) throw notFound();
    return { article };
  },
  notFoundComponent: () => (
    <div className="min-h-screen bg-background"><Navbar /><div className="pt-40 text-center"><h1 className="font-display text-3xl font-bold">Article not found</h1><Link to="/knowledge-base" className="mt-4 inline-block text-sm underline">Back to knowledge base</Link></div></div>
  ),
  head: ({ loaderData }) =>
    loaderData
      ? pageHead({
          title: `${loaderData.article.title} | EmmaForYou Guides`,
          description: clip(loaderData.article.excerpt),
          path: `/knowledge-base/${loaderData.article.slug}`,
          type: "article",
          jsonLd: [
            breadcrumbLd([{ name: "Home", path: "/" }, { name: "Knowledge base", path: "/knowledge-base" }, { name: loaderData.article.title, path: `/knowledge-base/${loaderData.article.slug}` }]),
            articleLd({
              headline: loaderData.article.title,
              description: loaderData.article.excerpt,
              path: `/knowledge-base/${loaderData.article.slug}`,
              section: loaderData.article.category,
            }),
          ],
        })
      : { meta: [{ title: "Guide not found — EmmaForYou" }, { name: "robots", content: "noindex" }] },
});

function ArticlePage() {
  const { article } = Route.useLoaderData();
  const [voted, setVoted] = useState<null | boolean>(null);
  const related = KNOWLEDGE.filter((a) => a.category === article.category && a.slug !== article.slug).slice(0, 3);

  async function vote(helpful: boolean) {
    setVoted(helpful);
    try { await supabase.from("knowledge_feedback").insert({ article_slug: article.slug, helpful }); } catch { /* ignore */ }
  }

  // very simple markdown -> html (h2, p, ul/ol)
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-32 pb-24">
        <article className="mx-auto max-w-3xl px-5">
          <Link to="/knowledge-base" className="text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground">← Knowledge base</Link>
          <div className="mt-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <span>{article.category}</span><span>·</span><span>{article.difficulty}</span><span>·</span><span>{article.readMin} min read</span>
          </div>
          <h1 className="mt-3 font-display text-4xl font-extrabold leading-tight md:text-5xl">{article.title}</h1>
          <p className="mt-4 text-lg text-muted-foreground">{article.excerpt}</p>

          <div className="prose-emma mt-10 space-y-5 text-foreground">
            {renderBody(article.body)}
          </div>

          <div className="mt-12 rounded-2xl border border-border bg-card p-6 text-center">
            <p className="font-display text-base font-bold">Was this article helpful?</p>
            {voted === null ? (
              <div className="mt-3 flex justify-center gap-3">
                <button onClick={() => vote(true)} className="rounded-full border border-border px-5 py-2 text-sm font-medium hover:bg-foreground hover:text-background">👍 Yes</button>
                <button onClick={() => vote(false)} className="rounded-full border border-border px-5 py-2 text-sm font-medium hover:bg-foreground hover:text-background">👎 No</button>
              </div>
            ) : <p className="mt-2 text-sm text-muted-foreground">Thanks for the feedback!</p>}
          </div>

          <div className="mt-10 rounded-3xl p-1" style={{ background: "var(--gradient-brand)" }}>
            <div className="rounded-[22px] bg-card p-6 md:p-8 text-center">
              <h3 className="font-display text-xl font-bold">Want us to do this for you?</h3>
              <p className="mt-2 text-sm text-muted-foreground">We implement everything in this article — and a lot more — for businesses worldwide.</p>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <Link to={serviceForTopic(article.category).to} className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold hover:border-[color:var(--emma-violet)]">How our {serviceForTopic(article.category).label} service works</Link>
                <a href={buildWa(`Hi! I read "${article.title}" — I'd love help implementing this.`)} target="_blank" rel="noopener noreferrer" className="btn-primary-gradient inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white">Talk to a strategist →</a>
              </div>
            </div>
          </div>

          {related.length > 0 && (
            <div className="mt-14">
              <h3 className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">Related articles</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {related.map((r) => (
                  <Link key={r.slug} to="/knowledge-base/$slug" params={{ slug: r.slug }} className="rounded-2xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:shadow-md">
                    <p className="font-display text-sm font-bold leading-snug">{r.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{r.readMin} min</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      </main>
      <Footer />
    </div>
  );
}

function renderBody(body: string) {
  // Split into lines and group into blocks: heading | list | paragraph
  const lines = body.split(/\n/);
  const out: React.ReactNode[] = [];
  let para: string[] = [];
  let list: { type: "ul" | "ol"; items: string[] } | null = null;

  const flushPara = () => {
    if (para.length) {
      out.push(
        <p key={`p-${out.length}`} className="leading-relaxed">
          {para.join(" ")}
        </p>,
      );
      para = [];
    }
  };
  const flushList = () => {
    if (list) {
      const Tag = list.type === "ul" ? "ul" : "ol";
      out.push(
        <Tag
          key={`l-${out.length}`}
          className={`ml-5 ${list.type === "ul" ? "list-disc" : "list-decimal"} space-y-1`}
        >
          {list.items.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </Tag>,
      );
      list = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushPara();
      flushList();
      continue;
    }
    if (line.startsWith("## ")) {
      flushPara();
      flushList();
      out.push(
        <h2 key={`h-${out.length}`} className="font-display text-2xl font-bold mt-8">
          {line.replace(/^##\s+/, "")}
        </h2>,
      );
      continue;
    }
    const ol = line.match(/^(\d+)\.\s+(.*)$/);
    if (ol) {
      flushPara();
      if (!list || list.type !== "ol") {
        flushList();
        list = { type: "ol", items: [] };
      }
      list.items.push(ol[2]);
      continue;
    }
    if (line.startsWith("- ")) {
      flushPara();
      if (!list || list.type !== "ul") {
        flushList();
        list = { type: "ul", items: [] };
      }
      list.items.push(line.replace(/^-\s+/, ""));
      continue;
    }
    flushList();
    para.push(line);
  }
  flushPara();
  flushList();
  return out;
}