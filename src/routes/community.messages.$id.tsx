import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { pageHead } from "@/lib/seo";
import { useCommunitySession } from "@/lib/community/session";
import MessageThread from "@/components/community/MessageThread";
import { openAuth } from "@/components/community/AuthDialog";

export const Route = createFileRoute("/community/messages/$id")({
  head: () => pageHead({ title: "Conversation — EmmaForYou Community", description: "A private conversation in the EmmaForYou Community.", path: "/community/messages", noindex: true }),
  component: ThreadPage,
});

function ThreadPage() {
  const { id } = Route.useParams();
  const { ready, uid } = useCommunitySession();
  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/community/messages" className="mb-3 inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" aria-hidden="true" />All messages</Link>
      {!ready ? <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Loading" /></div>
        : !uid ? <div className="rounded-2xl border border-border bg-card p-8 text-center"><p className="text-sm text-muted-foreground">Sign in to see this conversation.</p><button type="button" onClick={() => openAuth(undefined, "signin")} className="btn-primary-gradient mt-4 rounded-full px-5 py-2.5 text-sm font-semibold text-white">Sign in</button></div>
        : <MessageThread conversationId={id} uid={uid} />}
    </div>
  );
}
