import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { pageHead } from "@/lib/seo";
import { useCommunitySession } from "@/lib/community/session";
import MessageThread from "@/components/community/MessageThread";

export const Route = createFileRoute("/community/inbox/$id")({
  head: () => pageHead({ title: "Support conversation — EmmaForYou Community", description: "A community assistant conversation.", path: "/community/inbox", noindex: true }),
  component: InboxThread,
});

function InboxThread() {
  const { id } = Route.useParams();
  const { ready, uid, staff } = useCommunitySession();
  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/community/inbox" className="mb-3 inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Support inbox</Link>
      {!ready ? <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Loading" /></div>
        : !uid || !staff ? <p className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">This area is for the EmmaForYou team.</p>
        : <MessageThread conversationId={id} uid={uid} staffView />}
    </div>
  );
}
