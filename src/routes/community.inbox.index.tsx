import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Headset, Loader2 } from "lucide-react";
import { pageHead } from "@/lib/seo";
import { friendly } from "@/lib/community/api";
import { staffInbox, type Conversation } from "@/lib/community/messages";
import { useCommunitySession } from "@/lib/community/session";
import ConversationList from "@/components/community/ConversationList";

export const Route = createFileRoute("/community/inbox/")({
  head: () => pageHead({ title: "Support inbox — EmmaForYou Community", description: "Community assistant conversations for the support team.", path: "/community/inbox", noindex: true }),
  component: InboxPage,
});

function InboxPage() {
  const { ready, uid, staff } = useCommunitySession();
  const [list, setList] = useState<Conversation[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { if (ready && uid && staff) staffInbox(uid).then(setList).catch((e) => { setError(friendly(e)); setList([]); }); }, [ready, uid, staff]);
  if (ready && !staff) return <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-8 text-center"><h1 className="font-display text-xl font-bold">Support inbox</h1><p className="mt-2 text-sm text-muted-foreground">This area is for the EmmaForYou team.</p><Link to="/community" className="mt-4 inline-flex rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted">Back to the community</Link></div>;
  const waiting = list?.filter((c) => c.human_requested_at && c.control === "ai").length ?? 0;
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="flex items-center gap-2 font-display text-2xl font-extrabold"><Headset className="h-6 w-6 text-[var(--emma-violet)]" aria-hidden="true" />Support inbox</h1>
      <p className="mt-1 text-sm text-muted-foreground">Members' chats with the community assistant. {waiting ? `${waiting} waiting for a person.` : "Nobody is waiting for a person."} Take over any chat to reply yourself; the AI stops until you hand it back.</p>
      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
      <div className="mt-4">{list === null ? <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-label="Loading" /></div> : list.length === 0 ? <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">No assistant conversations yet.</p> : <ConversationList list={list} uid={uid!} staffView />}</div>
    </div>
  );
}
