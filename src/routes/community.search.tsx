import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { KineticText } from "@/components/future/Kinetic";
import { useEffect, useState } from "react";
import { Loader2, Search, HelpCircle } from "lucide-react";
import { pageHead } from "@/lib/seo";
import { friendly, searchCommunity, type SearchHit } from "@/lib/community/api";
import { TOPICS } from "@/lib/community/types";
import { Avatar, timeAgo } from "@/components/community/RichText";
import { DiscoverPanel } from "@/components/community/CommunityShell";

type T = "all" | "posts" | "questions" | "people";
const TYPES: { id: T; label: string }[] = [{ id: "all", label: "All" }, { id: "posts", label: "Posts" }, { id: "questions", label: "Questions" }, { id: "people", label: "People" }];

export const Route = createFileRoute("/community/search")({
  validateSearch: (s: Record<string, unknown>): { q?: string; type?: T } => ({
    ...(typeof s.q === "string" && s.q.trim() ? { q: s.q.slice(0, 100) } : {}),
    ...(typeof s.type === "string" && TYPES.some((t) => t.id === s.type) ? { type: s.type as T } : {}),
  }),
  head: () => pageHead({ title: "Explore the community — EmmaForYou", description: "Search posts, questions and people in the EmmaForYou Community.", path: "/community/search", noindex: true }),
  component: SearchPage,
});

function SearchPage() {
  const { q = "", type = "all" } = Route.useSearch();
  const navigate = useNavigate({ from: "/community/search" });
  const [text, setText] = useState(q);
  const [hits, setHits] = useState<SearchHit[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => setText(q), [q]);
  useEffect(() => {
    if (q.trim().length < 2) { setHits(null); return; }
    let live = true;
    setLoading(true); setError("");
    searchCommunity(q, type).then((h) => { if (live) setHits(h); }).catch((e) => { if (live) { setError(friendly(e)); setHits([]); } }).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [q, type]);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl font-extrabold"><KineticText text="Explore" base={60} /></h1>
      <form role="search" className="mt-3" onSubmit={(e) => { e.preventDefault(); navigate({ search: { q: text.trim() || undefined, type }, replace: true }); }}>
        <label htmlFor="community-search" className="sr-only">Search posts, questions and people</label>
        <div className="relative"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input id="community-search" type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder="Search posts, questions and people" className="input rounded-full py-3 pl-10" autoFocus={!q} /></div>
      </form>
      <div role="group" aria-label="Result type" className="mt-3 flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TYPES.map((t) => <button key={t.id} type="button" aria-pressed={type === t.id} onClick={() => navigate({ search: { q: q || undefined, type: t.id }, replace: true })} className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${type === t.id ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"}`}>{t.label}</button>)}
      </div>

      {q.trim().length < 2 ? (
        <div className="mt-6 space-y-4">
          <section className="rounded-2xl border border-border bg-card p-4">
            <h2 className="font-display text-base font-bold">Browse by topic</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {TOPICS.map((t) => <li key={t.id}><Link to="/community" search={{ topic: t.id }} className="flex min-h-11 items-center rounded-xl border border-border px-3 text-sm font-medium hover:border-[var(--emma-violet)]">{t.label}</Link></li>)}
            </ul>
            <Link to="/community" search={{ sort: "unanswered" }} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--emma-violet)] hover:underline"><HelpCircle className="h-4 w-4" aria-hidden="true" />Answer unanswered questions</Link>
          </section>
          <div className="space-y-4 xl:hidden"><DiscoverPanel /></div>
        </div>
      ) : (
        <section aria-live="polite" aria-busy={loading} className="mt-4">
          {loading ? <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-label="Searching" /></div>
            : error ? <p role="alert" className="text-sm text-red-600">{error}</p>
            : !hits || hits.length === 0 ? <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">No results for “{q}”. Try other words, or ask the community.</p>
            : (
              <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
                <li className="sr-only">{hits.length} results</li>
                {hits.map((h) => (
                  <li key={`${h.result_type}-${h.id}`}>
                    {h.result_type === "person" ? (
                      <Link to="/community/u/$username" params={{ username: h.username }} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50">
                        <Avatar name={h.display_name} src={h.avatar_url} size={40} />
                        <span className="min-w-0"><span className="block truncate text-sm font-semibold">{h.display_name} <span className="font-normal text-muted-foreground">@{h.username}</span></span>{h.snippet && <span className="block truncate text-xs text-muted-foreground">{h.snippet}</span>}</span>
                      </Link>
                    ) : (
                      <Link to="/community/post/$id" params={{ id: h.id }} className="block px-4 py-3 hover:bg-muted/50">
                        <span className="text-xs capitalize text-muted-foreground">{h.kind} · {h.display_name} · {timeAgo(h.published_at)}</span>
                        <span className="mt-0.5 block text-sm font-semibold">{h.title || h.snippet?.slice(0, 90)}</span>
                        {h.title && h.snippet && <span className="mt-0.5 line-clamp-2 block text-sm text-muted-foreground">{h.snippet}</span>}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
        </section>
      )}
    </div>
  );
}
