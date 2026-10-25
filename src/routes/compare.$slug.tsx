import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { KineticText } from "@/components/future/Kinetic";
import { CheckCircle2 } from "lucide-react";
import ToolShell from "../components/tools/ToolShell";
import { COMPARISONS, UPDATED, findComparison } from "@/lib/comparisons";
import { pageHead, breadcrumbLd, articleLd } from "@/lib/seo";

export const Route = createFileRoute("/compare/$slug")({
  component: Page,
  loader: ({ params }) => {
    const c = findComparison(params.slug);
    if (!c) throw notFound();
    return { slug: c.slug };
  },
  head: ({ loaderData }) => {
    const c = loaderData ? findComparison(loaderData.slug) : undefined;
    if (!c) return { meta: [{ title: "Comparison not found — EmmaForYou" }, { name: "robots", content: "noindex" }] };
    const path = `/compare/${c.slug}`;
    return pageHead({
      title: c.seoTitle,
      description: c.description.length > 158 ? `${c.description.slice(0, 155)}…` : c.description,
      path,
      type: "article",
      jsonLd: [
        breadcrumbLd([{ name: "Home", path: "/" }, { name: "Comparisons", path: "/compare" }, { name: c.title, path }]),
        articleLd({ headline: c.title, description: c.description, path, authorName: "Emmanuel Akinloye Oluwaseun", section: c.category }),
      ],
    });
  },
  notFoundComponent: () => (
    <ToolShell eyebrow="Comparisons" title="That comparison doesn't exist" intro="It may have been renamed.">
      <Link to="/compare" className="font-semibold text-[var(--emma-violet)]">See all comparisons →</Link>
    </ToolShell>
  ),
});

function Page() {
  const { slug } = Route.useLoaderData();
  const c = findComparison(slug)!;
  return (
    <ToolShell eyebrow={`Comparison · ${c.category}`} title={c.title} intro={c.description} answers={c.faqs} width="max-w-5xl">
      <div className="space-y-12">
        <section className="rounded-[22px] border-2 border-[var(--emma-violet)] bg-card p-6" aria-labelledby="short-answer">
          <h2 id="short-answer" className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--emma-violet)]"><KineticText text="The short answer" base={30} /></h2>
          <p className="mt-2 text-lg leading-relaxed text-foreground">{c.answer}</p>
        </section>

        <section aria-labelledby="side-by-side">
          <h2 id="side-by-side" className="font-display text-2xl font-semibold tracking-tight"><KineticText text="Side by side" base={30} /></h2>
          <div className="mt-5 overflow-x-auto rounded-[20px] border border-border">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-muted/60">
                <tr><th scope="col" className="p-4 font-semibold"><span className="sr-only">Feature</span></th>{c.options.map((o) => <th key={o} scope="col" className="p-4 font-display font-semibold">{o}</th>)}</tr>
              </thead>
              <tbody>
                {c.rows.map((r) => (
                  <tr key={r.label} className="border-t border-border align-top">
                    <th scope="row" className="p-4 font-medium text-muted-foreground">{r.label}</th>
                    {r.values.map((v, i) => <td key={i} className="p-4 text-foreground">{v}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Updated {UPDATED}. Products and prices change; check official sites for current details.</p>
        </section>

        <section aria-labelledby="best-for">
          <h2 id="best-for" className="font-display text-2xl font-semibold tracking-tight"><KineticText text="Which is best for you?" base={30} /></h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {c.bestFor.map((b) => (
              <div key={b.option} className="rounded-[20px] border border-border bg-card p-5"><p className="flex items-center gap-2 font-display font-semibold"><CheckCircle2 className="h-5 w-5 text-[var(--emma-violet)]" />{b.option}</p><p className="mt-2 text-sm text-muted-foreground">{b.when}</p></div>
            ))}
          </div>
        </section>

        {c.notes.map((n) => (
          <section key={n.title}><h2 className="font-display text-xl font-semibold">{n.title}</h2><p className="mt-2 leading-relaxed text-muted-foreground">{n.body}</p></section>
        ))}

        <section className="rounded-[22px] bg-muted p-6" aria-labelledby="how-help">
          <h2 id="how-help" className="font-display text-xl font-semibold"><KineticText text="Where EmmaForYou fits" base={30} /></h2>
          <p className="mt-2 text-muted-foreground">{c.howWeHelp.text}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {c.howWeHelp.links.map((l) => <Link key={l.to} to={l.to} className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold hover:border-[var(--emma-violet)]">{l.label} →</Link>)}
            <Link to="/book" className="btn-primary-gradient rounded-full px-4 py-2 text-sm font-semibold text-white">Book a free call</Link>
          </div>
        </section>

        <section aria-labelledby="more-compare">
          <h2 id="more-compare" className="font-display text-xl font-semibold"><KineticText text="More comparisons" base={30} /></h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {COMPARISONS.filter((x) => x.slug !== c.slug).slice(0, 6).map((x) => (
              <li key={x.slug}><Link to="/compare/$slug" params={{ slug: x.slug }} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:border-[var(--emma-violet)]"><span className="text-xl" aria-hidden="true">{x.icon}</span><span className="font-medium">{x.title}</span></Link></li>
            ))}
          </ul>
        </section>
      </div>
    </ToolShell>
  );
}
