import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarCheck, Copy, Heart, Loader2, MessageCircle, Monitor, Smartphone, Trash2, WandSparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PhoneFrame, { type Platform } from "@/components/prototype/PhoneFrame";
import { QrCard } from "@/components/prototype/SavePrototype";
import { ShowcaseArt, timeAgo, type ShowcaseListItem } from "@/components/showcase/ShowcaseCard";
import ShowcaseStrip from "@/components/showcase/ShowcaseStrip";
import { removeFromShowcase } from "@/components/showcase/ShowcaseOptIn";
import { supabase } from "@/integrations/supabase/client";
import { likeShowcase } from "@/lib/showcase-data";
import { KIND_LABEL, industryName, myItems, type ShowcaseKind } from "@/lib/showcase";
import { previewDocument } from "@/lib/prototype";
import { pageHead } from "@/lib/seo";
import { track } from "@/lib/analytics";

interface Item extends Omit<ShowcaseListItem, "preview"> { payload: Record<string, unknown> }

export const Route = createFileRoute("/showcase/$slug")({
  component: ShowcaseItemPage,
  head: ({ params }) => pageHead({ title: "Made on EmmaForYou", description: "Something a visitor built with EmmaForYou's free tools. Try it, then build your own.", path: `/showcase/${params.slug}`, noindex: true }),
});

function buildLike(item: Item): string {
  const k = item.kind as ShowcaseKind;
  if ((k === "app" || k === "website") && item.summary) return `/?proto_kind=${k}&proto_idea=${encodeURIComponent(item.summary.replace(/\[(business|email|phone|link)\]/g, "my business").slice(0, 480))}#prototype`;
  return KIND_LABEL[k].toolPath;
}

function ShowcaseItemPage() {
  const { slug } = Route.useParams();
  const [item, setItem] = useState<Item | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");
  const [platform, setPlatform] = useState<Platform>("ios");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [mine, setMine] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).rpc("showcase_get", { p_slug: slug }).then(({ data, error }: { data: Item | null; error: unknown }) => {
      if (!alive) return;
      if (error || !data) { setState("missing"); return; }
      setItem(data); setLikes(data.likes); setState("ready");
      setPlatform(data.payload?.platform === "android" ? "android" : "ios");
      track("showcase_viewed", { kind: data.kind });
    });
    try { setLiked(localStorage.getItem(`efy_like_${slug}`) === "1"); } catch { /* ignore */ }
    setMine(myItems().some((m) => m.slug === slug));
    return () => { alive = false; };
  }, [slug]);

  const doc = useMemo(() => (item && typeof item.payload.html === "string" ? previewDocument(item.payload.html as string) : ""), [item]);
  const url = typeof window !== "undefined" ? `${window.location.origin}/showcase/${slug}` : `/showcase/${slug}`;

  if (state !== "ready" || !item) {
    return (
      <div className="min-h-screen bg-background"><Navbar />
        <main className="grid min-h-[70vh] place-items-center px-6 pt-28 text-center">
          {state === "loading" ? <Loader2 className="h-8 w-8 animate-spin text-[var(--emma-violet)]" aria-label="Loading" /> : (
            <div><h1 className="font-display text-2xl font-bold">This item isn't available</h1><p className="mt-2 text-muted-foreground">It may have been removed by the person who made it.</p><Link to="/showcase" className="mt-5 inline-flex items-center gap-1 font-semibold text-[var(--emma-violet)]">See the showcase <ArrowRight className="h-4 w-4" /></Link></div>
          )}
        </main>
      </div>
    );
  }

  const k = item.kind as ShowcaseKind;
  const p = item.payload;
  const ind = industryName(item.industry);
  const wa = `https://wa.me/?text=${encodeURIComponent(`Look what was built with EmmaForYou's free tools: ${item.title} ${url}`)}`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main id="main-content" className="mx-auto grid max-w-6xl gap-8 px-5 pb-24 pt-28 md:pt-32 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-start" data-showcase-item={k}>
        <section className="min-w-0" aria-labelledby="sc-title">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{KIND_LABEL[k].one}{ind ? ` · ${ind}` : ""}{item.place ? ` · ${item.place}` : ""}</p>
          <h1 id="sc-title" className="mt-1 font-display text-3xl font-bold md:text-4xl">{item.title}</h1>
          {item.summary && <p className="mt-2 max-w-2xl text-muted-foreground">{item.summary}</p>}

          <div className="mt-6">
            {k === "app" && (
              <>
                <div className="mb-3 flex gap-1">{(["ios", "android"] as Platform[]).map((pl) => <button key={pl} type="button" aria-pressed={platform === pl} onClick={() => setPlatform(pl)} className="efy-page-chip">{pl === "ios" ? "iPhone" : "Android"}</button>)}</div>
                <PhoneFrame platform={platform} maxHeight={780} label={item.title}><iframe title={item.title} srcDoc={doc} sandbox="allow-scripts allow-forms" /></PhoneFrame>
                <p className="mt-3 text-center text-sm text-muted-foreground">Tap around: it works like a real app (sample content).</p>
              </>
            )}
            {(k === "website" || k === "makeover") && (
              <div className="prototype-browser">
                <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
                  <div className="flex items-center gap-1.5" aria-hidden="true"><span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" /><span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" /><span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" /></div>
                  <div className="flex gap-1">
                    <button type="button" aria-pressed={device === "desktop"} aria-label="Desktop" onClick={() => setDevice("desktop")} className="grid h-8 w-8 place-items-center rounded-md aria-pressed:bg-muted"><Monitor className="h-4 w-4" /></button>
                    <button type="button" aria-pressed={device === "mobile"} aria-label="Mobile" onClick={() => setDevice("mobile")} className="grid h-8 w-8 place-items-center rounded-md aria-pressed:bg-muted"><Smartphone className="h-4 w-4" /></button>
                  </div>
                </div>
                <div className="prototype-stage"><iframe title={item.title} srcDoc={doc} sandbox="allow-scripts allow-forms" className={`prototype-iframe device-${device}`} /></div>
              </div>
            )}
            {k === "audit" && <AuditView p={p} />}
            {k === "emails" && <EmailsView p={p} />}
            {k === "plan" && <PlanView p={p} />}
          </div>
          <p className="mt-6 text-xs text-muted-foreground">Made by a visitor with our free {KIND_LABEL[k].tool.toLowerCase()} and shared with their permission. Sample content generated by AI, not EmmaForYou client work.</p>
        </section>

        <aside className="grid min-w-0 gap-5 rounded-[24px] border border-border bg-card p-5 lg:sticky lg:top-28 [&>*]:min-w-0">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{timeAgo(item.created_at)} · {item.views} views</span>
            <button type="button" aria-pressed={liked} disabled={liked} onClick={async () => { setLiked(true); setLikes((n) => n + 1); try { localStorage.setItem(`efy_like_${slug}`, "1"); } catch { /* ignore */ } const n = await likeShowcase(slug); if (typeof n === "number") setLikes(n); track("showcase_like", { kind: k }); }} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold ${liked ? "border-rose-300 bg-rose-50 text-rose-600 dark:bg-rose-500/10" : "border-border"}`}>
              <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} aria-hidden="true" /> {likes}
            </button>
          </div>
          <a href={buildLike(item)} onClick={() => track("cta_click", { cta: "showcase_build_like", kind: k })} className="btn-primary-gradient inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 font-semibold text-white"><WandSparkles className="h-5 w-5" aria-hidden="true" /> {k === "audit" ? "Audit my website" : k === "emails" ? "Write my email sequence" : k === "plan" ? "Make my 90-day plan" : "Build one like this, free"}</a>
          <Link to="/book" onClick={() => track("cta_click", { cta: "showcase_book", kind: k })} className="btn-gold inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 font-semibold"><CalendarCheck className="h-4 w-4" aria-hidden="true" /> Get the real one built</Link>
          <div className="grid gap-2 border-t border-border pt-4">
            <p className="text-sm font-semibold">Share</p>
            <div className="flex flex-wrap gap-2">
              <a href={wa} target="_blank" rel="noopener noreferrer" onClick={() => track("showcase_share", { via: "whatsapp" })} className="inline-flex items-center gap-1.5 rounded-full bg-[#25d366] px-4 py-2 text-xs font-semibold text-white"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</a>
              <button type="button" onClick={() => navigator.clipboard?.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }, () => {})} className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-semibold"><Copy className="h-3.5 w-3.5" /> {copied ? "Copied" : "Copy link"}</button>
            </div>
            {k === "app" && <div className="mt-2"><QrCard url={url} label="Scan to open on your phone" /><p className="mt-2 text-center text-xs text-muted-foreground">Scan to try it on your phone</p></div>}
          </div>
          {mine && (
            <button type="button" onClick={async () => { if (await removeFromShowcase(slug)) setState("missing"); }} className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs text-muted-foreground hover:text-foreground"><Trash2 className="h-3.5 w-3.5" /> Remove my item from the showcase</button>
          )}
        </aside>
        <div className="lg:col-span-2"><ShowcaseStrip industry={item.industry ?? undefined} title={ind ? `More from ${ind.toLowerCase()}` : "More from the showcase"} min={2} /></div>
      </main>
      <Footer />
    </div>
  );
}

function AuditView({ p }: { p: Record<string, unknown> }) {
  const pr = (Array.isArray(p.priorities) ? p.priorities : []) as { title?: string; impact?: string }[];
  return (
    <div className="grid gap-5 rounded-[24px] border border-border bg-card p-6">
      <div className="flex flex-wrap items-center gap-6"><ShowcaseArt item={{ kind: "audit", title: "", preview: p }} />
        <div className="min-w-0 flex-1"><p className="font-display text-xl font-bold">{String(p.headline ?? "")}</p><p className="mt-1 text-sm text-muted-foreground">{String(p.summary ?? "")}</p>{typeof p.host === "string" && <p className="mt-2 text-xs text-muted-foreground">Website: {p.host}</p>}</div>
      </div>
      {pr.length > 0 && <div><p className="text-sm font-semibold">Top fixes</p><ol className="mt-2 grid gap-2">{pr.map((x, i) => <li key={i} className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-2 text-sm"><span>{i + 1}. {x.title}</span><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${x.impact === "high" ? "fu-hot" : x.impact === "medium" ? "fu-warm" : "fu-cool"}`}>{x.impact}</span></li>)}</ol></div>}
    </div>
  );
}

function EmailsView({ p }: { p: Record<string, unknown> }) {
  const emails = (Array.isArray(p.emails) ? p.emails : []) as { day?: number; subject?: string; preview?: string; body?: string }[];
  return (
    <ol className="grid gap-4">
      {emails.map((e, i) => (
        <li key={i} className="rounded-[20px] border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email {i + 1} · day {Number(e.day) || 0}</p>
          <p className="mt-1 font-display text-lg font-semibold">{e.subject}</p>
          {e.preview && <p className="text-sm text-muted-foreground">{e.preview}</p>}
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{e.body}</p>
        </li>
      ))}
    </ol>
  );
}

function PlanView({ p }: { p: Record<string, unknown> }) {
  const ms = (Array.isArray(p.milestones) ? p.milestones : []) as { month?: number; outcome?: string; measure?: string }[];
  const weeks = (Array.isArray(p.weeks) ? p.weeks : []) as { week?: number; focus?: string; actions?: string[] }[];
  const habits = (Array.isArray(p.habits) ? p.habits : []) as string[];
  return (
    <div className="grid gap-5">
      {typeof p.northStar === "string" && p.northStar && <p className="rounded-[20px] border border-[var(--emma-violet)]/30 bg-[var(--emma-violet)]/5 p-5 font-display text-lg font-semibold">{p.northStar}</p>}
      <ol className="grid gap-3 md:grid-cols-3">{ms.map((m, i) => <li key={i} className="rounded-[20px] border border-border bg-card p-5"><p className="text-xs font-semibold uppercase tracking-wider text-[var(--emma-violet)]">Month {i + 1}</p><p className="mt-1 font-semibold">{m.outcome}</p>{m.measure && <p className="mt-1 text-sm text-muted-foreground">{m.measure}</p>}</li>)}</ol>
      {weeks.length > 0 && <details className="rounded-[20px] border border-border bg-card p-5"><summary className="cursor-pointer font-semibold">All 12 weeks</summary><ol className="mt-3 grid gap-3 sm:grid-cols-2">{weeks.map((w, i) => <li key={i}><p className="text-sm font-semibold">Week {i + 1}: {w.focus}</p><ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">{(w.actions ?? []).map((a, j) => <li key={j}>{a}</li>)}</ul></li>)}</ol></details>}
      {habits.length > 0 && <div className="rounded-[20px] border border-border bg-card p-5"><p className="font-semibold">Weekly habits</p><ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">{habits.map((h, i) => <li key={i}>{h}</li>)}</ul></div>}
    </div>
  );
}
