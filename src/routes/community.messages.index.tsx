import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bot, Loader2 } from "lucide-react";
import { pageHead } from "@/lib/seo";
import { friendly } from "@/lib/community/api";
import { assistantConversation, myConversations, type Conversation } from "@/lib/community/messages";
import { useCommunitySession } from "@/lib/community/session";
import ConversationList from "@/components/community/ConversationList";
import { openAuth } from "@/components/community/AuthDialog";

export const Route = createFileRoute("/community/messages/")({
  head: () => pageHead({ title: "Messages — EmmaForYou Community", description: "Your private messages in the EmmaForYou Community.", path: "/community/messages", noindex: true }),
  component: MessagesPage,
});

function MessagesPage() {
  const { ready, uid, profile } = useCommunitySession();
  const navigate = useNavigate();
  const [list, setList] = useState<Conversation[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (ready && uid && profile) myConversations(uid).then(setList).catch((e) => { setError(friendly(e)); setList([]); }); }, [ready, uid, profile]);

  async function openAssistant() {
    setBusy(true);
    try { const id = await assistantConversation(); navigate({ to: "/community/messages/$id", params: { id } }); }
    catch (e) { setError(friendly(e)); setBusy(false); }
  }

  if (ready && !uid) return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-8 text-center">
      <h1 className="font-display text-xl font-bold">Messages</h1>
      <p className="mt-2 text-sm text-muted-foreground">Sign in to message members and chat with the community assistant.</p>
      <button type="button" onClick={() => openAuth(undefined, "signin")} className="btn-primary-gradient mt-4 rounded-full px-5 py-2.5 text-sm font-semibold text-white">Sign in</button>
    </div>
  );
  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-2xl font-extrabold">Messages</h1>
        {profile && <button type="button" onClick={openAssistant} disabled={busy} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border px-4 text-sm font-semibold hover:bg-muted disabled:opacity-60">{busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Bot className="h-4 w-4" aria-hidden="true" />}Ask the assistant</button>}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">Private conversations. To message someone, open their profile and choose Message.</p>
      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
      <div className="mt-4">
        {ready && uid && !profile ? <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">Create your profile to send messages. <Link to="/community/settings" search={{ setup: true }} className="font-semibold text-foreground underline">Set up profile</Link></p>
          : list === null ? <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-label="Loading messages" /></div>
          : list.length === 0 ? <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">No conversations yet.</p>
          : <ConversationList list={list} uid={uid!} />}
      </div>
    </div>
  );
}
