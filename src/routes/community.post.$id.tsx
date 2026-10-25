import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { KineticText } from "@/components/future/Kinetic";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { pageHead, breadcrumbLd, absoluteUrl } from "@/lib/seo";
import { getPostMeta } from "@/lib/community/meta-server";
import { getPost, friendly } from "@/lib/community/api";
import { useCommunitySession } from "@/lib/community/session";
import type { FeedPost } from "@/lib/community/types";
import PostCard from "@/components/community/PostCard";
import CommentThread from "@/components/community/CommentThread";
import Composer from "@/components/community/Composer";
import { openAuth } from "@/components/community/AuthDialog";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/community/post/$id")({
  loader: ({ params }) => getPostMeta({ data: params.id }),
  head: ({ loaderData, params }) => {
    const m = loaderData;
    const path = `/community/post/${params.id}`;
    if (!m) return pageHead({ title: "Community post — EmmaForYou Community", description: "A post in the EmmaForYou Community.", path, noindex: true });
    return pageHead({
      title: `${m.title} — EmmaForYou Community`, description: m.description || `A ${m.kind} by ${m.author} in the EmmaForYou Community.`, path, type: "article",
      publishedTime: m.published_at ?? undefined,
      jsonLd: [
        breadcrumbLd([{ name: "Home", path: "/" }, { name: "Community", path: "/community" }, { name: m.title, path }]),
        {
          "@context": "https://schema.org", "@type": m.kind === "question" ? "QAPage" : "DiscussionForumPosting",
          ...(m.kind === "question"
            ? { mainEntity: { "@type": "Question", name: m.title, text: m.description, author: { "@type": "Person", name: m.author }, datePublished: m.published_at } }
            : { headline: m.title, text: m.description, url: absoluteUrl(path), datePublished: m.published_at, author: { "@type": "Person", name: m.author, url: absoluteUrl(`/community/u/${m.username}`) } }),
        },
      ],
    });
  },
  component: PostPage,
});

function PostPage() {
  const { id } = Route.useParams();
  const { ready, uid, staff } = useCommunitySession();
  const navigate = useNavigate();
  const [post, setPost] = useState<FeedPost | null | undefined>(undefined);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!ready) return;
    let live = true;
    setPost(undefined); setError("");
    getPost(id, uid).then((p) => { if (live) setPost(p); }).catch((e) => { if (live) { setError(friendly(e)); setPost(null); } });
    return () => { live = false; };
  }, [id, uid, ready]);

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/community" className="mb-3 inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Back to feed</Link>
      {post === undefined ? (
        <div className="flex justify-center py-16" role="status"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" /><span className="sr-only">Loading post</span></div>
      ) : post === null ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <h1 className="font-display text-xl font-bold"><KineticText text="Post not available" base={60} /></h1>
          <p className="mt-2 text-sm text-muted-foreground">{error || (uid ? "This post was removed, or it isn't visible to you." : "It may be for members only, or it was removed.")}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {!uid && <button type="button" onClick={() => openAuth("Sign in to see members-only posts.", "signin")} className="btn-primary-gradient rounded-full px-5 py-2.5 text-sm font-semibold text-white">Sign in</button>}
            <Link to="/community" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted">Browse the community</Link>
          </div>
        </div>
      ) : (
        <>
          <h1 className="sr-only">{post.title || `Post by ${post.author_name}`}</h1>
          {post.status === "draft" && <p className="mb-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">This is a draft. Only you can see it.</p>}
          {post.status === "removed" && <p className="mb-3 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm">This post was removed by a moderator and is hidden from the community.</p>}
          <PostCard post={post} full onChange={setPost} onRemoved={() => navigate({ to: "/community" })} onEdit={() => setEditing(true)} />
          {post.status === "published" && <div className="mt-4"><CommentThread post={post} onPostChange={setPost} /></div>}
        </>
      )}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-h-[92dvh] w-[96vw] max-w-2xl overflow-y-auto p-4 sm:p-6">
          <DialogTitle>Edit post</DialogTitle>
          <DialogDescription className="sr-only">Change your post and save it.</DialogDescription>
          {editing && uid && post && <Composer uid={uid} staff={staff} editing={post} onCancel={() => setEditing(false)} onDone={(p) => { setEditing(false); setPost(p); }} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
