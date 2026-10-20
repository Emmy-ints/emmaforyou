import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2, Send, Bot, UserRound, Headset, ShieldCheck } from "lucide-react";
import { newKey } from "@/lib/community/api";
import { askAssistant, getConversation, listMessages, markConversationRead, requestHuman, sendMessage, setControl, subscribeMessages, type Conversation, type Message } from "@/lib/community/messages";
import { Avatar, timeAgo } from "./RichText";

/**
 * One conversation: direct message, a member's assistant chat, or (for staff) an assistant chat
 * they can take over. Messages arrive live; sending is idempotent (client key).
 */
export default function MessageThread({ conversationId, uid, staffView = false }: { conversationId: string; uid: string; staffView?: boolean }) {
  const [conv, setConv] = useState<Conversation | null | undefined>(undefined);
  const [msgs, setMsgs] = useState<Message[] | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState<"" | "send" | "ai" | "control" | "human">("");
  const [error, setError] = useState("");
  const [older, setOlder] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const key = useRef(newKey());

  const refreshConv = () => getConversation(conversationId, uid).then(setConv).catch(() => setConv(null));
  useEffect(() => {
    let live = true;
    setConv(undefined); setMsgs(null); setError("");
    getConversation(conversationId, uid).then((c) => { if (live) setConv(c); }).catch(() => { if (live) setConv(null); });
    listMessages(conversationId).then((m) => { if (live) { setMsgs(m); setOlder(m.length === 50); } }).catch(() => { if (live) setMsgs([]); });
    const off = subscribeMessages(conversationId, (m) => {
      setMsgs((list) => (list && !list.some((x) => x.id === m.id || (m.client_key && x.client_key === m.client_key)) ? [...list, m] : list?.map((x) => (m.client_key && x.client_key === m.client_key ? m : x)) ?? list));
      if (m.sender_kind === "system") void refreshConv();
    }, () => void refreshConv());
    void markConversationRead(conversationId, uid);
    return () => { live = false; off(); };
  }, [conversationId, uid]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { bottom.current?.scrollIntoView({ block: "end" }); if (msgs?.length) void markConversationRead(conversationId, uid); }, [msgs?.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const isStaffReply = staffView && conv?.kind === "assistant" && conv.member_a !== uid;
  const canWrite = conv && (!isStaffReply || conv.control === "human");

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const body = text.trim();
    if (!body || !conv || busy) return;
    setBusy("send"); setError("");
    const ck = key.current;
    const optimistic: Message = { id: `tmp-${ck}`, conversation_id: conv.id, sender_kind: isStaffReply ? "staff" : "member", sender_id: uid, body, created_at: new Date().toISOString(), client_key: ck };
    setMsgs((l) => [...(l ?? []), optimistic]);
    setText("");
    try {
      const saved = await sendMessage(conv.id, uid, body, isStaffReply ? "staff" : "member", ck);
      key.current = newKey();
      setMsgs((l) => l?.map((x) => (x.client_key === ck ? saved : x)) ?? l);
      if (conv.kind === "assistant" && !isStaffReply && conv.control === "ai") {
        setBusy("ai");
        const r = await askAssistant(conv.id);
        if (r.error) setError(r.error);
        if (r.handled === "human") void refreshConv();
      }
    } catch (err) {
      setMsgs((l) => l?.filter((x) => x.client_key !== ck) ?? l);
      setText(body);
      setError(err instanceof Error ? err.message : "Couldn't send. Please try again.");
    } finally { setBusy(""); }
  }

  async function loadOlder() {
    if (!msgs?.length) return;
    const m = await listMessages(conversationId, msgs[0].created_at).catch(() => []);
    setMsgs([...m, ...msgs]); setOlder(m.length === 50);
  }

  async function control(next: "ai" | "human") {
    setBusy("control"); setError("");
    try { await setControl(conversationId, next); await refreshConv(); } catch (e) { setError(e instanceof Error ? e.message : "Couldn't change who's handling this."); }
    finally { setBusy(""); }
  }
  async function askHuman() {
    setBusy("human"); setError("");
    try { await requestHuman(); await refreshConv(); } catch (e) { setError(e instanceof Error ? e.message : "Couldn't send the request."); }
    finally { setBusy(""); }
  }

  if (conv === undefined) return <div className="flex justify-center py-16" role="status"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" /><span className="sr-only">Loading conversation</span></div>;
  if (conv === null) return <p className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">This conversation isn't available. <Link to="/community/messages" className="font-semibold text-foreground underline">Back to messages</Link></p>;

  const other = conv.kind === "direct" ? (conv.member_a === uid ? conv.b : conv.a) : conv.a;
  const title = conv.kind === "assistant" ? (isStaffReply ? `Assistant chat with ${conv.a?.display_name ?? "member"}` : "Community assistant") : other?.display_name ?? "Member";
  const nameOf = (m: Message) => m.sender_kind === "ai" ? "Community assistant (AI)" : m.sender_kind === "staff" ? "EmmaForYou team" : m.sender_kind === "system" ? "" : m.sender_id === conv.member_a ? conv.a?.display_name : conv.b?.display_name;

  return (
    <div className="flex min-h-[60vh] flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <header className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
        {conv.kind === "assistant" && !isStaffReply ? <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--emma-violet)]/10 text-[var(--emma-violet)]"><Bot className="h-5 w-5" aria-hidden="true" /></span> : <Avatar name={other?.display_name ?? "?"} src={other?.avatar_url} size={40} />}
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-base font-bold">{title}</h1>
          <p className="truncate text-xs text-muted-foreground">
            {conv.kind === "direct" ? (other ? <Link to="/community/u/$username" params={{ username: other.username }} className="hover:underline">@{other.username}</Link> : "") :
              conv.control === "human" ? "A member of the EmmaForYou team is handling this chat" : `AI assistant${conv.specialist ? ` · ${conv.specialist} specialist` : ""}${conv.human_requested_at ? " · a person has been requested" : ""}`}
          </p>
        </div>
        {conv.kind === "assistant" && !isStaffReply && conv.control === "ai" && !conv.human_requested_at && (
          <button type="button" onClick={askHuman} disabled={Boolean(busy)} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-semibold hover:bg-muted disabled:opacity-50"><UserRound className="h-4 w-4" aria-hidden="true" />Talk to a person</button>
        )}
        {isStaffReply && (
          conv.control === "ai"
            ? <button type="button" onClick={() => control("human")} disabled={Boolean(busy)} className="btn-primary-gradient inline-flex min-h-9 items-center gap-1.5 rounded-full px-4 text-xs font-semibold text-white disabled:opacity-50"><Headset className="h-4 w-4" aria-hidden="true" />Take over</button>
            : <button type="button" onClick={() => control("ai")} disabled={Boolean(busy)} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border px-4 text-xs font-semibold hover:bg-muted disabled:opacity-50"><Bot className="h-4 w-4" aria-hidden="true" />Hand back to AI</button>
        )}
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite" aria-label="Messages">
        {older && <div className="flex justify-center"><button type="button" onClick={loadOlder} className="text-xs font-semibold text-muted-foreground hover:text-foreground">Load earlier messages</button></div>}
        {msgs === null ? <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" aria-label="Loading messages" /> : msgs.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">{conv.kind === "assistant" ? "Ask anything about websites, online stores, apps, AI, automation or marketing, or about using the community. The assistant is an AI; you can ask for a person at any time." : "No messages yet. Say hello."}</p>
        ) : msgs.map((m) => {
          if (m.sender_kind === "system") return <p key={m.id} className="mx-auto max-w-md text-center text-xs text-muted-foreground"><ShieldCheck className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />{m.body}</p>;
          const mine = m.sender_id === uid;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${mine ? "bg-[var(--emma-violet)] text-white" : m.sender_kind === "ai" ? "border border-[var(--emma-violet)]/30 bg-[var(--emma-violet)]/5" : "bg-muted"}`}>
                {!mine && <p className="mb-0.5 text-[11px] font-semibold opacity-80">{nameOf(m)}</p>}
                <p className="whitespace-pre-line break-words">{m.body}</p>
                <p className={`mt-1 text-[10px] ${mine ? "text-white/70" : "text-muted-foreground"}`}>{m.id.startsWith("tmp-") ? "Sending…" : timeAgo(m.created_at)}</p>
              </div>
            </div>
          );
        })}
        {busy === "ai" && <p className="flex items-center gap-2 text-xs text-muted-foreground" role="status"><Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />The assistant is writing…</p>}
        <div ref={bottom} />
      </div>

      {error && <p role="alert" className="px-4 pb-2 text-sm text-red-600">{error}</p>}
      {canWrite ? (
        <form onSubmit={send} className="flex items-end gap-2 border-t border-border p-3">
          <label htmlFor="msg-input" className="sr-only">Write a message</label>
          <textarea id="msg-input" rows={1} value={text} maxLength={4000} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}
            placeholder={isStaffReply ? "Reply as the EmmaForYou team…" : "Write a message…"} className="input max-h-40 min-h-11 flex-1 resize-y" />
          <button type="submit" disabled={!text.trim() || busy === "send" || busy === "ai"} className="btn-primary-gradient inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white disabled:opacity-50" aria-label="Send">{busy === "send" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}</button>
        </form>
      ) : <p className="border-t border-border p-3 text-center text-xs text-muted-foreground">Take over the conversation to reply. The AI stops answering as soon as you do.</p>}
    </div>
  );
}
