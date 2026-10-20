import { createServerFn } from "@tanstack/react-start";
import type { BlogPost } from "./blog-data";

/**
 * Blog posts are loaded on the server so the browser receives only the post being read and short
 * summaries of related posts (see knowledge-server.ts for why loaders must not read the full lists).
 */
export type PostSummary = Omit<BlogPost, "body">;
const summary = ({ body: _body, ...meta }: BlogPost): PostSummary => meta;

export const getBlogPost = createServerFn({ method: "GET" })
  .inputValidator((slug: string) => String(slug ?? "").slice(0, 160))
  .handler(async ({ data }) => {
    const { POSTS, getPost } = await import("./blog-data");
    const post = getPost(data);
    if (!post) return null;
    const sameTopic = POSTS.filter((p) => p.slug !== post.slug && p.category === post.category).slice(0, 3);
    const related = (sameTopic.length ? sameTopic : POSTS.filter((p) => p.slug !== post.slug).slice(0, 3)).map(summary);
    return { post, related };
  });
