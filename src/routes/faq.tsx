import { createFileRoute } from "@tanstack/react-router";
import { KineticText } from "@/components/future/Kinetic";
import { useState, useMemo } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { pageHead, breadcrumbLd } from "@/lib/seo";
import { CATEGORIES } from "@/lib/faq-data";

export const Route = createFileRoute("/faq")({
  component: FaqPage,
  head: () =>
    pageHead({
      title: "FAQ — Pricing, Timelines & How EmmaForYou Works",
      description: "Answers about pricing, payment, timelines, services, AI automation and working with EmmaForYou from Nigeria, the USA, Europe or Africa.",
      path: "/faq",
      jsonLd: [
        breadcrumbLd([{ name: "Home", path: "/" }, { name: "FAQ", path: "/faq" }]),
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: CATEGORIES.flatMap((c) => c.items).map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        },
      ],
    }),
});


function FaqPage() {
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("general");
  const [open, setOpen] = useState<string | null>(null);

  const all = useMemo(() => CATEGORIES.flatMap((c) => c.items.map((i) => ({ ...i, cat: c.id }))), []);
  const filtered = search
    ? all.filter((i) => i.q.toLowerCase().includes(search.toLowerCase()) || i.a.toLowerCase().includes(search.toLowerCase()))
    : (CATEGORIES.find((c) => c.id === activeCat)?.items || []).map((i) => ({ ...i, cat: activeCat }));

  return (
    <>
      <Navbar />
      <main id="main-content">
        <section className="section-padding pt-32">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-display text-4xl font-extrabold md:text-6xl">Frequently Asked <span className="gradient-text">Questions</span></h1>
            <p className="mt-4 text-base text-muted-foreground">Everything you need to know about working with us.</p>
            <input type="search" aria-label="Search FAQs" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Search FAQs..."
              className="mt-8 w-full rounded-full border border-border bg-card px-6 py-4 text-sm focus:border-emma-blue focus:outline-none" />
          </div>

          {!search && (
            <div className="mx-auto mt-10 flex max-w-4xl flex-wrap justify-center gap-2">
              {CATEGORIES.map((c) => (
                <button key={c.id} onClick={() => setActiveCat(c.id)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold ${
                    activeCat === c.id ? "bg-emma-charcoal text-white" : "border border-border hover:border-emma-blue"
                  }`}>{c.label}</button>
              ))}
            </div>
          )}

          <div className="mx-auto mt-10 max-w-3xl space-y-3">
            {filtered.length === 0 && <p className="text-center text-muted-foreground">No matches — try different keywords.</p>}
            {filtered.map((f, i) => {
              const key = `${f.cat}-${i}`;
              return (
                <div key={key} className="overflow-hidden rounded-2xl border border-border bg-card">
                  <button onClick={() => setOpen(open === key ? null : key)} aria-expanded={open === key}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left hover:bg-muted/30">
                    <span className="font-display text-base font-bold">{f.q}</span>
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full bg-emma-blue/10 text-emma-blue transition-transform ${open === key ? "rotate-45" : ""}`}>+</span>
                  </button>
                  <div className="acc-panel" data-open={open === key} inert={open !== key}><div><p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{f.a}</p></div></div>
                </div>
              );
            })}
          </div>

          <div className="mx-auto mt-14 max-w-2xl rounded-3xl border border-border bg-card p-8 text-center shadow-lg">
            <h2 className="font-display text-xl font-bold"><KineticText text="Still have questions?" base={30} /></h2>
            <p className="mt-2 text-sm text-muted-foreground">Chat with us directly on WhatsApp — we usually respond within minutes.</p>
            <a href="https://wa.me/message/HHGMMWMRJFYUC1" target="_blank" rel="noopener noreferrer"
              className="btn-gold mt-5 inline-flex rounded-full px-6 py-3 text-sm font-semibold">Chat With Us →</a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
