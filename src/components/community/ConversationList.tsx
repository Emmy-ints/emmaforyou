import { Link } from "@tanstack/react-router";
import { Bot } from "lucide-react";
import type { Conversation } from "@/lib/community/messages";
import { Avatar, timeAgo } from "./RichText";

export default function ConversationList({ list, uid, staffView = false }: { list: Conversation[]; uid: string; staffView?: boolean }) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
      {list.map((c) => {
        const other = c.kind === "direct" ? (c.member_a === uid ? c.b : c.a) : c.a;
        const assistantMine = c.kind === "assistant" && !staffView;
        const name = assistantMine ? "Community assistant" : c.kind === "assistant" ? `${other?.display_name ?? "Member"} · assistant chat` : other?.display_name ?? "Member";
        return (
          <li key={c.id}>
            <Link to={staffView ? "/community/inbox/$id" : "/community/messages/$id"} params={{ id: c.id }} className={`flex items-center gap-3 px-4 py-3 hover:bg-muted/50 ${c.unread ? "bg-[var(--emma-violet)]/5" : ""}`}>
              {assistantMine ? <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--emma-violet)]/10 text-[var(--emma-violet)]"><Bot className="h-5 w-5" aria-hidden="true" /></span> : <Avatar name={other?.display_name ?? "?"} src={other?.avatar_url} size={40} />}
              <span className="min-w-0 flex-1">
                <span className={`flex items-center gap-2 text-sm ${c.unread ? "font-bold" : "font-semibold"}`}>
                  <span className="truncate">{name}</span>
                  {staffView && c.human_requested_at && c.control === "ai" && <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">Waiting for a person</span>}
                  {staffView && c.control === "human" && <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">Human</span>}
                </span>
                <span className="block truncate text-xs text-muted-foreground">{c.last_message_preview ?? "No messages yet"}</span>
              </span>
              <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(c.last_message_at)}</span>
              {c.unread && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--emma-violet)]" aria-label="Unread" />}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
