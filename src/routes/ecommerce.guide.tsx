import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Send, Trash2, Bot, Loader2 } from "lucide-react";
import { pageHead } from "@/lib/seo";
import { api, clearGuide, guideHistory } from "@/lib/ecom/workspace";
import { Card, ErrorBox, PageIntro, useWorkspace } from "@/components/ecom/ui";

export const Route = createFileRoute("/ecommerce/guide")({
  validateSearch: (s: Record<string, unknown>): { ask?: string } => (typeof s.ask === "string" && s.ask.trim() ? { ask: s.ask.slice(0, 500) } : {}),
  head: () => pageHead({ title: "AI Ecommerce Business Guide | EmmaForYou", description: "Ask questions about starting or growing your online store. Answers use the reports you've saved and say what's known and what's a suggestion.", path: "/ecommerce/guide" }),
  component: Guide,
});

interface Msg { id: string; role: "user" | "assistant"; body: string }
const STARTERS = ["What should I do first this week?", "Which of my audit issues matters most?", "How do I test a product before buying stock?", "How can I lower my delivery costs?"];

function Guide() {
  const { ask } = Route.useSearch();
  const { workspace, signedIn, ready } = useWorkspace();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState(ask ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => { if (workspace) guideHistory(workspace.id).then((h) => setMsgs(h.map((m) => ({ id: m.id, role: m.role, body: m.body })))).catch(() => undefined); }, [workspace]);
  useEffect(() => { end.current?.scrollIntoView({ block: "end", behavior: "smooth" }); }, [msgs, busy]);
  useEffect(() => { if (ask) setText(ask); }, [ask]);

  async function send(e?: FormEvent, preset?: string) {
    e?.preventDefault();
    const q = (preset ?? text).trim();
    if (!q || !workspace || busy) return;
    setBusy(true); setError(""); setText("");
    setMsgs((m) => [...m, { id: `u${Date.now()}`, role: "user", body: q }]);
    try {
      const r = await api<{ reply: string }>("/api/ecom-guide", { workspaceId: workspace.id, message: q });
      setMsgs((m) => [...m, { id: `a${Date.now()}`, role: "assistant", body: r.reply }]);
    } catch (er) { setError(er instanceof Error ? er.message : "The guide couldn't answer."); setText(q); setMsgs((m) => m.slice(0, -1)); }
    finally { setBusy(false); }
  }
  async function clear() {
    if (!workspace || !window.confirm("Clear this conversation? This deletes it from your workspace.")) return;
    await clearGuide(workspace.id).catch(() => undefined); setMsgs([]);
  }

  return (
    <div>
      <PageIntro eyebrow="Business guide" title="Ask the guide">An AI assistant that reads the reports saved in <strong>{workspace?.name ?? "your workspace"}</strong> (roadmap, audits, research, profit and diagnosis) to tailor its advice. It is automated, not a person, and it will tell you when something needs data you haven't provided. It can't promise sales or results.</PageIntro>
      {ready && !signedIn ? (
        <Card><p className="text-sm">The guide uses your saved work, so it needs an account. <Link to="/login" search={{ next: "/ecommerce/guide" }} className="font-semibold underline">Sign in or create an account</Link>. Prefer a human? <Link to="/book" className="font-semibold underline">Book a call</Link> or ask the <Link to="/community" className="font-semibold underline">Community</Link>.</p></Card>
      ) : (
        <Card className="flex min-h-[60vh] flex-col" title={<span className="flex items-center gap-2"><Bot className="h-4 w-4 text-[var(--emma-violet)]" aria-hidden="true" />Conversation</span>} actions={msgs.length > 0 ? <button type="button" onClick={clear} className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-red-600"><Trash2 className="h-3.5 w-3.5" aria-hidden="true" />Clear</button> : undefined}>
          <div className="flex-1 space-y-3 overflow-y-auto" aria-live="polite">
            {msgs.length === 0 && !busy && (
              <div className="py-6 text-center">
                <p className="text-sm text-muted-foreground">Try one of these, or ask your own question.</p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">{STARTERS.map((s) => <button key={s} type="button" onClick={() => send(undefined, s)} disabled={!workspace} className="rounded-full border border-border px-3 py-1.5 text-sm hover:bg-muted">{s}</button>)}</div>
              </div>
            )}
            {msgs.map((m) => (
              <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex"}>
                <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${m.role === "user" ? "bg-[var(--emma-violet)] text-white" : "bg-muted"}`}>
                  {m.role === "assistant" && <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">AI guide</span>}
                  {m.body}
                </div>
              </div>
            ))}
            {busy && <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Thinking…</div>}
            <div ref={end} />
          </div>
          {error && <div className="mt-3"><ErrorBox message={error} /></div>}
          <form onSubmit={send} className="mt-3 flex gap-2 border-t border-border pt-3">
            <label htmlFor="guide-q" className="sr-only">Your question</label>
            <textarea id="guide-q" rows={2} className="input resize-none" placeholder="Ask about your plan, products, store or numbers" value={text} maxLength={3000} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }} />
            <button type="submit" disabled={busy || !text.trim() || !workspace} aria-label="Send" className="btn-primary-gradient inline-flex h-auto w-12 shrink-0 items-center justify-center rounded-xl text-white disabled:opacity-60"><Send className="h-4 w-4" aria-hidden="true" /></button>
          </form>
          <p className="mt-2 text-[11px] text-muted-foreground">Up to 30 questions an hour. Don't share passwords or payment details. Conversations are stored in your workspace until you clear them.</p>
        </Card>
      )}
    </div>
  );
}
