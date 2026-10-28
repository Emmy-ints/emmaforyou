import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

/**
 * Portfolio: concept covers, a mockup and a launch graphic rendered live with the same engine as
 * the free tools. Fictional titles, labelled as demos — never presented as client work.
 * Fonts and the renderer load only when the section scrolls into view.
 */
const CONCEPTS = [
  { title: "The River Remembers", subtitle: "A novel", author: "Concept Author", template: "classic", palette: "ocean", font: "serif", genre: "Literary fiction" },
  { title: "Midnight in Lagos", subtitle: "", author: "Concept Author", template: "noir", palette: "ink", font: "serif", genre: "Thriller", tagline: "The city never sleeps. Neither do its secrets." },
  { title: "The 90-Day Growth Playbook", subtitle: "Simple systems for small businesses", author: "Concept Author", template: "nonfiction", palette: "violet", font: "sans", genre: "Business", tagline: "Plan it. Build it. Grow it." },
  { title: "Stars Over Ìbàdàn", subtitle: "", author: "Concept Author", template: "stars", palette: "midnight", font: "serif", genre: "Fantasy" },
] as const;

export default function PublishingConcepts() {
  const ref = useRef<HTMLElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver((e) => { if (e.some((x) => x.isIntersecting)) { setShow(true); io.disconnect(); } }, { rootMargin: "300px" });
    io.observe(el); return () => io.disconnect();
  }, []);
  return (
    <section ref={ref} id="publishing-concepts" className="py-24 md:py-28" aria-labelledby="pc-h">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <p className="sx-kicker"><span className="sx-kicker-dot" aria-hidden="true" />eBook publishing &amp; book design</p>
        <h2 id="pc-h" className="sx-title">Publishing concepts</h2>
        <p className="sx-sub max-w-3xl">Concept covers, a 3D mockup and a launch graphic, rendered live in your browser with the same engine as our free book tools. <strong>These are demos with fictional titles — not client work.</strong></p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CONCEPTS.map((c) => <Cover key={c.title} c={c} show={show} />)}
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Promo kind="paperback" show={show} label="3D paperback mockup (concept)" />
          <Promo kind="square" show={show} label="Launch post (concept)" />
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/publishing/cover-designer" className="btn-gold inline-flex items-center gap-2 rounded-full px-6 py-3 text-[15px]">Design a book cover <ArrowRight className="h-4 w-4" /></Link>
          <Link to="/services/$slug" params={{ slug: "ebook-publishing" }} className="nav-ghost h-auto px-6 py-3">Explore publishing services</Link>
        </div>
      </div>
    </section>
  );
}

type C = (typeof CONCEPTS)[number];
function Cover({ c, show }: { c: C; show: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!show) return;
    let off = false;
    (async () => {
      const [{ drawFront, PALETTES, DEFAULT_DESIGN }, { loadCanvasFonts }] = await Promise.all([import("@/lib/books/cover"), import("@/lib/books/fonts")]);
      await loadCanvasFonts().catch(() => undefined);
      const el = ref.current; if (!el || off) return;
      el.width = 500; el.height = 800;
      drawFront(el.getContext("2d")!, { x: 0, y: 0, w: 500, h: 800 }, { ...DEFAULT_DESIGN, template: c.template, palette: PALETTES[c.palette], titleFont: c.font, uppercase: c.template === "noir", align: c.template === "nonfiction" ? "left" : "center", seed: c.title.length * 7 }, { title: c.title, subtitle: c.subtitle, author: c.author, tagline: "tagline" in c ? c.tagline : "" });
    })();
    return () => { off = true; };
  }, [show, c]);
  return (
    <figure className="lg rounded-2xl border border-border p-3">
      <canvas ref={ref} role="img" aria-label={`Concept cover: ${c.title} (${c.genre}), fictional`} className="aspect-[5/8] w-full rounded bg-muted shadow-[0_18px_40px_-24px_rgba(0,0,0,.6)]" />
      <figcaption className="mt-2 text-xs text-muted-foreground"><span className="font-semibold text-foreground">{c.genre}</span> · concept, not client work</figcaption>
    </figure>
  );
}

function Promo({ kind, show, label }: { kind: "paperback" | "square"; show: boolean; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!show) return;
    let off = false;
    (async () => {
      const [cover, mock, fonts] = await Promise.all([import("@/lib/books/cover"), import("@/lib/books/mockup"), import("@/lib/books/fonts")]);
      await fonts.loadCanvasFonts().catch(() => undefined);
      const src = document.createElement("canvas"); src.width = 500; src.height = 800;
      cover.drawFront(src.getContext("2d")!, { x: 0, y: 0, w: 500, h: 800 }, { ...cover.DEFAULT_DESIGN, template: "noir", palette: cover.PALETTES.ink, uppercase: true }, { title: "Midnight in Lagos", author: "Concept Author", tagline: "The city never sleeps. Neither do its secrets." });
      const f = mock.FORMATS.find((x) => x.id === kind)!;
      const el = ref.current; if (!el || off) return;
      const k = 700 / f.w; el.width = Math.round(f.w * k); el.height = Math.round(f.h * k);
      const ctx = el.getContext("2d")!; ctx.scale(k, k);
      mock.renderFormat(ctx, f, src, { headline: "Out now", sub: "A Lagos thriller (concept)", cta: "Read the first chapter", quote: "", attribution: "", badge: "OUT NOW" }, { bg1: "#1d1033", bg2: "#0b0d24", fg: "#ffffff", accent: "#ff9f5a" });
    })();
    return () => { off = true; };
  }, [show, kind]);
  return (
    <figure className="lg rounded-2xl border border-border p-3">
      <canvas ref={ref} role="img" aria-label={`${label}, fictional book`} className="h-auto w-full rounded bg-muted" />
      <figcaption className="mt-2 text-xs text-muted-foreground">{label} · made with the free mockup generator</figcaption>
    </figure>
  );
}
