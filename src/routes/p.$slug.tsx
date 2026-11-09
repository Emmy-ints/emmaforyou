import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCheck, Loader2, MessageCircle, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { pageHead } from "@/lib/seo";
import { previewDocument } from "@/lib/prototype";
import { prototypeCopy } from "@/lib/prototype-copy";
import { useI18n } from "@/lib/i18n";
import { buildWa } from "@/lib/leads";
import { track } from "@/lib/analytics";
import PhoneFrame, { type Platform } from "@/components/prototype/PhoneFrame";
import { CopyLink, QrCard } from "@/components/prototype/SavePrototype";
import Wordmark from "@/components/brand/Wordmark";

interface Shared {
  slug: string; kind: "website" | "app"; title: string; html: string; logo: string | null; platform: Platform;
  plan: { name?: string; primary?: string } | null; suggested_plan: string | null; created_at: string;
}

export const Route = createFileRoute("/p/$slug")({
  component: SharedPrototype,
  head: ({ params }) => pageHead({
    title: "Prototype made with EmmaForYou",
    description: "A clickable website or app prototype made with the free EmmaForYou prototype builder. Sample content only.",
    path: `/p/${params.slug}`,
    noindex: true,
  }),
});

function SharedPrototype() {
  const { slug } = Route.useParams();
  const { lang } = useI18n();
  const c = prototypeCopy[lang];
  const [data, setData] = useState<Shared | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");
  const [phone, setPhone] = useState(false);
  const [platform, setPlatform] = useState<Platform>("ios");

  useEffect(() => {
    let alive = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).rpc("prototype_share_public", { p_slug: slug }).then(({ data: v, error }: { data: Shared | null; error: unknown }) => {
      if (!alive) return;
      if (error || !v) { setState("missing"); return; }
      setData(v); setPlatform(v.platform === "android" ? "android" : "ios"); setState("ready");
      track("prototype_viewed", { kind: v.kind });
    });
    return () => { alive = false; };
  }, [slug]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const on = () => setPhone(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const doc = useMemo(() => (data ? previewDocument(data.html, data.logo) : ""), [data]);
  const url = typeof window !== "undefined" ? window.location.href.split("#")[0] : `/p/${slug}`;
  const wa = buildWa(`${c.waMessage.replace("{kind}", data?.kind === "app" ? c.app.toLowerCase() : c.website.toLowerCase())} ${url}`);

  if (state !== "ready" || !data) {
    return (
      <main className="grid min-h-dvh place-items-center bg-background px-6 text-center">
        {state === "loading" ? <Loader2 className="h-8 w-8 animate-spin text-[var(--emma-violet)]" aria-label="Loading prototype" /> : (
          <div className="max-w-md">
            <h1 className="font-display text-2xl font-bold">This prototype isn't available</h1>
            <p className="mt-2 text-muted-foreground">The link may be mistyped. You can build a new one for free.</p>
            <Link to="/" hash="prototype" className="btn-primary-gradient mt-6 inline-flex min-h-11 items-center rounded-full px-6 font-semibold text-white">Build a free prototype</Link>
          </div>
        )}
      </main>
    );
  }

  // On a phone, the prototype IS the screen: full height, a slim bar on top, nothing floating over it.
  if (phone) {
    return (
      <main className="efy-shared-mobile">
        <div className="efy-shared-bar">
          <span className="truncate">{data.title} · <span className="opacity-70">Demo</span></span>
          <Link to="/book" search={{ prototype: data.slug }} className="shrink-0 font-semibold text-[var(--emma-cyan)]">{c.makeReal} →</Link>
        </div>
        <iframe title={data.title} srcDoc={doc} sandbox="allow-scripts allow-forms" className="efy-shared-frame" />
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-background">
      <header className="flex items-center justify-between gap-4 border-b border-border px-6 py-3">
        <Link to="/" aria-label="EmmaForYou home"><Wordmark size="sm" /></Link>
        <span className="text-xs text-muted-foreground">Prototype · sample content only</span>
      </header>
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <section className="min-w-0" aria-label={data.title}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h1 className="font-display text-2xl font-bold">{data.title}</h1>
            {data.kind === "app" && (
              <div className="flex gap-1">
                {(["ios", "android"] as Platform[]).map((pl) => (
                  <button key={pl} type="button" aria-pressed={platform === pl} onClick={() => setPlatform(pl)} className="efy-page-chip">{pl === "ios" ? c.iphone : c.android}</button>
                ))}
              </div>
            )}
          </div>
          {data.kind === "app" ? (
            <PhoneFrame platform={platform} maxHeight={780} label={data.title}><iframe title={data.title} srcDoc={doc} sandbox="allow-scripts allow-forms" /></PhoneFrame>
          ) : (
            <div className="prototype-browser">
              <div className="flex items-center gap-1.5 border-b border-border px-3 py-2.5" aria-hidden="true"><span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" /><span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" /><span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" /></div>
              <iframe title={data.title} srcDoc={doc} sandbox="allow-scripts allow-forms" className="block h-[78vh] w-full border-0 bg-white" />
            </div>
          )}
        </section>
        <aside className="grid min-w-0 gap-5 rounded-[24px] border border-border bg-card p-5 [&>*]:min-w-0">
          <div>
            <p className="flex items-center gap-2 font-display font-bold"><Smartphone className="h-5 w-5 text-[var(--emma-violet)]" aria-hidden="true" /> {c.scanToOpen}</p>
            <div className="mt-3"><QrCard url={url} label={c.saved} /></div>
            <div className="mt-3"><CopyLink url={url} c={c} /></div>
          </div>
          <div className="grid gap-2 border-t border-border pt-4">
            <p className="text-sm font-semibold">{c.makeReal}</p>
            {data.suggested_plan && <p className="text-sm text-muted-foreground">{c.suggested}: {data.suggested_plan}</p>}
            <Link to="/book" search={{ prototype: data.slug }} onClick={() => track("cta_click", { cta: "shared_prototype_book" })} className="btn-gold inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 font-semibold"><CalendarCheck className="h-4 w-4" aria-hidden="true" /> {c.bookCall}</Link>
            <a href={wa} target="_blank" rel="noopener noreferrer" onClick={() => track("cta_click", { cta: "shared_prototype_whatsapp" })} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border px-5 text-sm font-semibold"><MessageCircle className="h-4 w-4 text-[#25d366]" aria-hidden="true" /> {c.whatsappUs}</a>
            <p className="text-xs text-muted-foreground">{c.realNote}</p>
          </div>
        </aside>
      </div>
    </main>
  );
}
