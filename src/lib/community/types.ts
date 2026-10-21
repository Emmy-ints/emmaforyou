/** Shared Community types and constants. Data comes only from the community_* tables (RLS-protected). */

export const REACTIONS = [
  { id: "like", emoji: "👍", label: "Like" },
  { id: "love", emoji: "❤️", label: "Love" },
  { id: "celebrate", emoji: "🎉", label: "Celebrate" },
  { id: "insightful", emoji: "💡", label: "Insightful" },
  { id: "support", emoji: "🤝", label: "Support" },
] as const;
export type ReactionKind = (typeof REACTIONS)[number]["id"];

export const POST_KINDS = [
  { id: "update", label: "Update", needsTitle: false, hint: "Share news, a win or a thought." },
  { id: "question", label: "Question", needsTitle: true, hint: "Ask the community for help." },
  { id: "poll", label: "Poll", needsTitle: false, hint: "Ask people to choose between 2–6 options." },
  { id: "project", label: "Project", needsTitle: true, hint: "Show something you built or designed." },
  { id: "tutorial", label: "Tutorial", needsTitle: true, hint: "Teach a method, step by step." },
  { id: "discussion", label: "Discussion", needsTitle: false, hint: "Start a technical or business discussion." },
  { id: "collaboration", label: "Collaboration", needsTitle: true, hint: "Look for a partner or collaborator." },
  { id: "help", label: "Need help", needsTitle: true, hint: "Request professional assistance." },
] as const;
export type PostKind = (typeof POST_KINDS)[number]["id"] | "announcement";

/** Topics map to the six existing solution categories plus the services' marketing and design areas. */
export const TOPICS: { id: string; label: string; solutions?: string }[] = [
  { id: "websites", label: "Websites & e-commerce", solutions: "/solutions/websites" },
  { id: "business-apps", label: "Business apps", solutions: "/solutions/business-apps" },
  { id: "ai-solutions", label: "AI", solutions: "/solutions/ai-solutions" },
  { id: "automation", label: "Automation & integrations", solutions: "/solutions/automation" },
  { id: "mobile-desktop", label: "Mobile & desktop apps", solutions: "/solutions/mobile-desktop" },
  { id: "industries", label: "Industry solutions", solutions: "/solutions/industries" },
  { id: "marketing", label: "Marketing & growth", solutions: "/services" },
  { id: "design", label: "Design & branding", solutions: "/services" },
  { id: "general", label: "General" },
];
export const topicLabel = (id: string | null | undefined) => TOPICS.find((t) => t.id === id)?.label ?? null;

export type FeedSort = "for_you" | "latest" | "popular" | "following" | "unanswered" | "discover";
export const FEED_SORTS: { id: FeedSort; label: string; needsAuth?: boolean }[] = [
  { id: "for_you", label: "For you" },
  { id: "latest", label: "Latest" },
  { id: "popular", label: "Popular" },
  { id: "following", label: "Following", needsAuth: true },
  { id: "unanswered", label: "Unanswered" },
  { id: "discover", label: "Discover" },
];

export interface MediaItem { type: "image" | "video"; path: string; alt?: string; w?: number; h?: number }

export interface FeedPost {
  id: string;
  author_id: string;
  kind: PostKind;
  title: string | null;
  body: string;
  link_url: string | null;
  media: MediaItem[];
  tags: string[];
  topic: string | null;
  poll_options: string[] | null;
  poll_counts: number[] | null;
  visibility: "public" | "members";
  status: "draft" | "published" | "removed";
  reactions: Partial<Record<ReactionKind, number>>;
  reaction_count: number;
  comment_count: number;
  engagement: number;
  accepted_comment_id: string | null;
  is_pinned: boolean;
  /** Set when the post belongs to a group (absent in feed rows). */
  group_id?: string | null;
  published_at: string | null;
  edited_at: string | null;
  author_username: string;
  author_name: string;
  author_headline: string | null;
  author_avatar: string | null;
  author_specialist: boolean;
  /** True for EmmaForYou's automated AI agents (always labelled in the UI). */
  author_agent?: boolean;
  my_reaction: ReactionKind | null;
  my_vote: number | null;
  saved: boolean;
  rank_score: number;
}

export interface Profile {
  user_id: string;
  username: string;
  display_name: string;
  headline: string | null;
  bio: string | null;
  location: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  website: string | null;
  skills: string[];
  interests: string[];
  links: { label: string; url: string }[];
  visibility: "public" | "members";
  is_specialist: boolean;
  /** Set only for EmmaForYou AI agents (never by members). */
  agent_slug?: string | null;
  suspended_at: string | null;
  post_count: number;
  follower_count: number;
  following_count: number;
  helpful_count: number;
  created_at: string;
}

export interface CommentRow {
  id: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  depth: number;
  body: string;
  status: "visible" | "deleted" | "removed";
  reactions: Partial<Record<ReactionKind, number>>;
  reaction_count: number;
  reply_count: number;
  is_helpful: boolean;
  edited_at: string | null;
  created_at: string;
  author: Pick<Profile, "username" | "display_name" | "avatar_url" | "headline" | "is_specialist" | "agent_slug"> | null;
}

export interface NotificationRow {
  id: string;
  type: "reaction" | "comment" | "reply" | "mention" | "follow" | "accepted" | "moderation" | "announcement";
  post_id: string | null;
  comment_id: string | null;
  read_at: string | null;
  created_at: string;
  actor: Pick<Profile, "username" | "display_name" | "avatar_url"> | null;
}

export const PROFILE_FIELDS = "user_id,username,display_name,headline,bio,location,avatar_url,cover_url,website,skills,interests,links,visibility,is_specialist,agent_slug,suspended_at,post_count,follower_count,following_count,helpful_count,created_at";
