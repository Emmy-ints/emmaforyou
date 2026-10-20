import { Fragment, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";

/**
 * Safe formatting for member-written text. Output is built from React elements only (never HTML
 * strings), so nothing a member writes can inject markup or scripts. Supports paragraphs, line
 * breaks, **bold**, `code`, links, @mentions and #tags.
 */
const TOKEN = /(https?:\/\/[^\s<>()]+[^\s<>().,!?;:'"])|(@[A-Za-z0-9_]{3,24})|(#[A-Za-z0-9-]{2,30})|(\*\*[^*\n]{1,200}\*\*)|(`[^`\n]{1,200}`)/g;

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = `${keyBase}-${m.index}`;
    const [tok, url, mention, tag, bold, code] = m;
    if (url) out.push(<a key={k} href={url} target="_blank" rel="noopener noreferrer nofollow ugc" className="break-all font-medium text-[var(--emma-violet)] underline-offset-2 hover:underline">{url.replace(/^https?:\/\//, "").slice(0, 60)}{url.replace(/^https?:\/\//, "").length > 60 ? "…" : ""}</a>);
    else if (mention) out.push(<Link key={k} to="/community/u/$username" params={{ username: mention.slice(1).toLowerCase() }} className="font-medium text-[var(--emma-violet)] hover:underline">{mention}</Link>);
    else if (tag) out.push(<Link key={k} to="/community" search={{ tag: tag.slice(1).toLowerCase() }} className="font-medium text-[var(--emma-violet)] hover:underline">{tag}</Link>);
    else if (bold) out.push(<strong key={k} className="font-semibold text-foreground">{bold.slice(2, -2)}</strong>);
    else if (code) out.push(<code key={k} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">{code.slice(1, -1)}</code>);
    else out.push(tok);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function RichText({ text, className = "" }: { text: string; className?: string }) {
  const paragraphs = text.replace(/\r\n/g, "\n").split(/\n{2,}/).filter((p) => p.trim());
  return (
    <div className={`space-y-3 whitespace-pre-wrap break-words leading-relaxed ${className}`}>
      {paragraphs.map((p, i) => (
        <p key={i}>{p.split("\n").map((line, j) => <Fragment key={j}>{j > 0 && <br />}{inline(line, `${i}-${j}`)}</Fragment>)}</p>
      ))}
    </div>
  );
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "";
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 604800) return `${Math.floor(s / 86400)}d`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: new Date(iso).getFullYear() === new Date().getFullYear() ? undefined : "numeric" });
}

export function Avatar({ name, src, size = 40 }: { name: string; src?: string | null; size?: number }) {
  const initials = name.split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";
  const hue = (name.charCodeAt(0) * 37) % 360;
  return src
    ? <img src={src} alt="" width={size} height={size} loading="lazy" className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
    : <span aria-hidden="true" className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white" style={{ width: size, height: size, fontSize: size * 0.38, background: `oklch(0.58 0.15 ${hue})` }}>{initials}</span>;
}
