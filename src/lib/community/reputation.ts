import type { Profile } from "./types";

/**
 * Reputation and badges, computed only from a member's real activity counters (maintained by the
 * database). Nothing is bought or granted by hand except the specialist badge, which only
 * administrators can assign.
 *   points = 10 per accepted/helpful answer + 2 per post + 1 per follower
 */
export interface Badge { id: string; label: string; description: string }

export function reputation(p: Pick<Profile, "post_count" | "helpful_count" | "follower_count">): number {
  return p.helpful_count * 10 + p.post_count * 2 + p.follower_count;
}

export function badges(p: Pick<Profile, "post_count" | "helpful_count" | "follower_count" | "is_specialist" | "created_at">): Badge[] {
  const out: Badge[] = [];
  if (p.is_specialist) out.push({ id: "specialist", label: "EmmaForYou specialist", description: "Verified by the EmmaForYou team." });
  if (p.helpful_count >= 25) out.push({ id: "expert-helper", label: "Expert helper", description: "25+ answers marked helpful." });
  else if (p.helpful_count >= 5) out.push({ id: "trusted-helper", label: "Trusted helper", description: "5+ answers marked helpful." });
  else if (p.helpful_count >= 1) out.push({ id: "helper", label: "Helper", description: "Gave an answer marked helpful." });
  if (p.post_count >= 50) out.push({ id: "prolific", label: "Prolific", description: "50+ posts." });
  else if (p.post_count >= 10) out.push({ id: "regular", label: "Regular", description: "10+ posts." });
  else if (p.post_count >= 1) out.push({ id: "first-post", label: "First post", description: "Shared a first post." });
  if (p.follower_count >= 100) out.push({ id: "influential", label: "Influential", description: "100+ followers." });
  else if (p.follower_count >= 10) out.push({ id: "followed", label: "Followed", description: "10+ followers." });
  return out;
}
