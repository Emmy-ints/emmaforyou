import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { KineticText } from "@/components/future/Kinetic";
import { useEffect, useState } from "react";
import { Check, Copy, Download, RotateCcw } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { LEAD_MAGNETS } from "@/lib/lead-magnets";
import { RESOURCE_CONTENT } from "@/lib/resources-content";
import { buildWa } from "@/lib/leads";
import { pageHead, breadcrumbLd } from "@/lib/seo";

export const Route = createFileRoute("/free-resources/$slug")({
  loader: ({ params }) => {
    const magnet = LEAD_MAGNETS.find((m) => m.slug === params.slug);
    const content = RESOURCE_CONTENT[params.slug];
    if (!magnet || !content) throw notFound();
    return { slug: params.slug };
  },
  head: ({ params }) => {
    const m = LEAD_MAGNETS.find((x) => x.slug === params.slug);
    if (!m) return {};
    return pageHead({
      title: `${m.title} — Free toolkit`,
      description: m.description.slice(0, 158),
      path: `/free-resources/${m.slug}`,
      jsonLd: [breadcrumbLd([{ name: "Home", path: "/" }, { name: "Free resources", path: "/free-resources" }, { name: m.title, path: `/free-resources/${m.slug}` }])],
    });
  },
  notFoundComponent: () => (
    <div className="min-h-screen bg-background"><Navbar /><main className="mx-auto max-w-3xl px-5 pb-24 pt-36"><h1 className="font-display text-3xl font-semibold"><KineticText text="That resource doesn't exist" base={60} /></h1><p className="mt-3 text-muted-foreground">It may have moved.</p><Link to="/free-resources" className="mt-6 inline-block font-semibold text-[var(--emma-violet)]">See all free toolkits →</Link></main><Footer /></div>
  ),
  component: ResourcePage,
});

const storeKey = (slug: string) => `efy_resource_${slug}`;

function ResourcePage() {
  const { slug } = Route.useLoaderData();
  const magnet = LEAD_MAGNETS.find((m) => m.slug === slug)!;
  const content = RESOURCE_CONTENT[slug];
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState("");

  // Ticks are saved in this browser only.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storeKey(slug));
      if (raw) setDone(JSON.parse(raw));
    } catch { /* storage unavailable */ }
  }, [slug]);
  const toggle = (id: string) => setDone((d) => {
    const next = { ...d, [id]: !d[id] };
    try { localStorage.setItem(storeKey(slug), JSON.stringify(next)); } catch { /* ignore */ }
    return next;
  });
  const reset = () => {
    setDone({});
    try { localStorage.removeItem(storeKey(slug)); } catch { /* ignore */ }
  };
  const copy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied((c) => (c === id ? "" : c)), 1500);
    } catch {
      setCopied("");
    }
  };

  const checkItems = content.sections.flatMap((s, si) => (s.checklist ? s.items.map((_, ii) => `${si}-${ii}`) : []));
  const ticked = checkItems.filter((id) => done[id]).length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="print:hidden"><Navbar /></div>
      <main id="main" className="mx-auto max-w-3xl px-5 pb-24 pt-32 print:pt-0">
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground print:hidden">
          <Link to="/free-resources" className="hover:text-foreground">Free resources</Link> <span aria-hidden="true">/</span> <span>{magnet.title}</span>
        </nav>
        <header className="mt-4 rounded-3xl p-6 text-white md:p-8" style={{ background: magnet.gradient }}>
          <div className="text-4xl" aria-hidden="true">{magnet.icon}</div>
          <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight md:text-4xl">{magnet.title}</h1>
          <p className="mt-2 text-sm text-white/85">{magnet.format} · Free</p>
        </header>

        <p className="mt-6 text-base text-muted-foreground">{content.intro}</p>

        <div className="mt-6 flex flex-wrap items-center gap-3 print:hidden">
          <button type="button" onClick={() => window.print()} className="btn-primary-gradient inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white">
            <Download className="h-4 w-4" aria-hidden="true" /> Save as PDF / print
          </button>
          {checkItems.length > 0 && (
            <>
              <span className="text-sm text-muted-foreground" aria-live="polite">{ticked} of {checkItems.length} done</span>
              <button type="button" onClick={reset} className="inline-flex items-center gap-1 rounded-full border border-border px-4 py-2 text-xs font-semibold hover:bg-muted">
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Clear ticks
              </button>
            </>
          )}
        </div>
        {checkItems.length > 0 && (
          <p className="mt-2 text-xs text-muted-foreground print:hidden">Your ticks are saved in this browser only.</p>
        )}

        <section className="mt-8 rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-lg font-bold"><KineticText text="How to use this" base={30} /></h2>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
            {content.howToUse.map((h) => <li key={h}>{h}</li>)}
          </ol>
        </section>

        {content.sections.map((section, si) => (
          <section key={section.title} className="mt-10 break-inside-avoid-page">
            <h2 className="font-display text-2xl font-bold">{section.title}</h2>
            {section.intro && <p className="mt-2 text-sm text-muted-foreground">{section.intro}</p>}
            <ul className="mt-4 space-y-2">
              {section.items.map((item, ii) => {
                const id = `${si}-${ii}`;
                if (section.checklist) {
                  return (
                    <li key={id}>
                      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-3 text-sm hover:bg-muted/50">
                        <input type="checkbox" checked={!!done[id]} onChange={() => toggle(id)} className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--primary)]" />
                        <span className={done[id] ? "text-muted-foreground line-through" : ""}>{item}</span>
                      </label>
                    </li>
                  );
                }
                return (
                  <li key={id} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 text-sm">
                    <span className="mt-0.5 w-6 shrink-0 text-right font-semibold text-muted-foreground">{ii + 1}.</span>
                    <span className="flex-1">{item}</span>
                    <button type="button" onClick={() => copy(id, item)} aria-label={`Copy item ${ii + 1}`} className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground print:hidden">
                      {copied === id ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        <section className="mt-12 rounded-3xl border border-border bg-card p-6 text-center print:hidden">
          <h2 className="font-display text-xl font-bold"><KineticText text="Want help putting this in place?" base={30} /></h2>
          <p className="mt-2 text-sm text-muted-foreground">We can set up the website, automations or campaigns for you, or review what you've got.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link to="/book" className="btn-primary-gradient rounded-full px-5 py-2.5 text-sm font-semibold text-white">Book a free strategy call</Link>
            <a href={buildWa(`Hi! I'm using "${magnet.title}" and would like help with it.`)} target="_blank" rel="noopener noreferrer" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted">Ask on WhatsApp</a>
            <Link to="/free-resources" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted">More free toolkits</Link>
          </div>
        </section>
      </main>
      <div className="print:hidden"><Footer /></div>
    </div>
  );
}
