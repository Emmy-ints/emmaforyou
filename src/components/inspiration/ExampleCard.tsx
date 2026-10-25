import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bookmark, BookmarkCheck, ExternalLink, Loader2 } from "lucide-react";
import { KIND_LABEL, hostLabel, safeHref, type Example } from "@/lib/inspiration/ui";

/** One inspiration card. Images are the source's own link preview (hot-linked, never re-hosted). */
export default function ExampleCard({ ex, sourceName, saved, onToggleSave, showImage = true }: {
  ex: Example; sourceName: string; saved: boolean; onToggleSave: (ex: Example) => Promise<void> | void; showImage?: boolean;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const open = safeHref(ex.original_url) ?? safeHref(ex.listing_url);
  const img = showImage && !imgFailed && ex.image_status !== "broken" ? safeHref(ex.image_url) : null;
  const tags = [...new Set([...ex.industries, ...ex.styles, ...ex.tags])].slice(0, 3);
  return (
    <article data-tilt="3" className="group flex min-w-0 flex-col overflow-hidden rounded-[20px] border border-border bg-card shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-[var(--emma-violet)]">
      <Link to="/inspiration/$id" params={{ id: ex.id }} className="relative block aspect-[16/10] overflow-hidden bg-muted" aria-label={`${ex.title}: details`}>
        {img ? (
          <img src={img} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setImgFailed(true)} className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.03]" sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 100vw" />
        ) : (
          <div className="flex h-full w-full flex-col justify-between bg-[linear-gradient(135deg,color-mix(in_oklab,var(--emma-violet)_22%,var(--card)),var(--card))] p-4">
            <span />
            <span className="line-clamp-2 break-words font-display text-2xl font-semibold leading-tight text-foreground/80">{ex.brand || hostLabel(ex.original_url) || ex.title}</span>
            <span className="text-xs text-muted-foreground">No preview · open the original</span>
          </div>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur">{KIND_LABEL[ex.kind]}</span>
      </Link>
      <div className="flex min-w-0 flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-display text-base font-semibold leading-snug"><Link to="/inspiration/$id" params={{ id: ex.id }} className="hover:text-[var(--emma-violet)]">{ex.title}</Link></h3>
        <p className="mt-1 truncate text-xs text-muted-foreground">{ex.original_url ? hostLabel(ex.original_url) : ex.brand ?? ""}{ex.platform ? ` · ${ex.platform}` : ""}</p>
        {tags.length > 0 && <ul className="mt-2 flex flex-wrap gap-1">{tags.map((t) => <li key={t} className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{t}</li>)}</ul>}
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <span className="truncate text-[11px] text-muted-foreground">via <span className="font-semibold text-foreground">{sourceName}</span></span>
          <div className="flex shrink-0 items-center gap-1.5">
            <button type="button" aria-pressed={saved} aria-label={saved ? `Remove ${ex.title} from saved` : `Save ${ex.title}`} disabled={busy}
              onClick={async () => { setBusy(true); try { await onToggleSave(ex); } finally { setBusy(false); } }}
              className={`grid h-9 w-9 place-items-center rounded-full border transition ${saved ? "border-[var(--emma-violet)] bg-[var(--emma-violet)] text-white" : "border-border text-muted-foreground hover:text-foreground"}`}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : saved ? <BookmarkCheck className="h-4 w-4" aria-hidden="true" /> : <Bookmark className="h-4 w-4" aria-hidden="true" />}
            </button>
            {open && <a href={open} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex min-h-9 items-center gap-1 rounded-full border border-border px-3 text-xs font-semibold hover:border-[var(--emma-violet)]" aria-label={`Open ${ex.title} (opens the original in a new tab)`}>Open<ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /></a>}
          </div>
        </div>
      </div>
    </article>
  );
}
