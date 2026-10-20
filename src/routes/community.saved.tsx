import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { pageHead } from "@/lib/seo";
import { friendly, savedPosts } from "@/lib/community/api";
import { useCommunitySession } from "@/lib/community/session";
import type { FeedPost } from "@/lib/community/types";
import PostCard from "@/components/community/PostCard";
import { openAuth } from "@/components/community/AuthDialog";

export const Route = createFileRoute("/community/saved")({
  head: () => pageHead({ title: "Saved posts — EmmaForYou Community", description: "Posts you saved in the EmmaForYou Community.", path: "/community/saved", noindex: true }),
  component: SavedPage,
});

function SavedPage() {
  const { ready, uid } = useCommunitySession();
  const [list, setList] = useState<FeedPost[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!ready || !uid) return;
    savedPosts(uid).then(setList).catch((e) => { setError(friendly(e)); setList([]); });
  }, [ready, uid]);

  if (ready && !uid) return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-8 text-center">
      <h1 className="font-display text-xl font-bold">Saved posts</h1>
      <p className="mt-2 text-sm text-muted-foreground">Sign in to see posts you've saved.</p>
      <button type="button" onClick={() => openAuth(undefined, "signin")} className="btn-primary-gradient mt-4 rounded-full px-5 py-2.5 text-sm font-semibold text-white">Sign in</button>
    </div>
  );
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl font-extrabold">Saved posts</h1>
      <p className="mt-1 text-sm text-muted-foreground">Only you can see what you've saved.</p>
      <div className="mt-4 space-y-4">
        {list === null ? <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-label="Loading saved posts" /></div>
          : list.length === 0 ? <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">{error || <>Nothing saved yet. Use the bookmark on any post to keep it here. <Link to="/community" className="font-semibold text-foreground underline">Browse the feed</Link></>}</p>
          : list.map((p) => <PostCard key={p.id} post={p} onChange={(n) => setList((l) => (n.saved ? l?.map((x) => (x.id === n.id ? n : x)) : l?.filter((x) => x.id !== n.id)) ?? l)} onRemoved={(id) => setList((l) => l?.filter((x) => x.id !== id) ?? l)} />)}
      </div>
    </div>
  );
}
