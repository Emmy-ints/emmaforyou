/**
 * Intern & Talent directory — shared types and the designation vocabulary (see docs/interns.md).
 * Interns are presented as contributors to EmmaForYou, never as employees, permanent staff,
 * senior or core team members. A designation only changes when an admin promotes someone.
 */
export type Designation = "intern" | "team_member" | "alumni";
export type InternStatus = "pending" | "active" | "completed" | "archived" | "promoted";

export const DESIGNATION: Record<Designation, { badge: string; label: string; role: string; cls: string }> = {
  intern: { badge: "INTERN", label: "Intern", role: "Intern at EmmaForYou", cls: "itn-badge-intern" },
  team_member: { badge: "TEAM MEMBER", label: "Team Member", role: "Team Member at EmmaForYou", cls: "itn-badge-team" },
  alumni: { badge: "ALUMNI", label: "Former Intern", role: "Former Intern (Alumni) of EmmaForYou", cls: "itn-badge-alumni" },
};

export const STATUS_LABEL: Record<InternStatus, string> = {
  pending: "Pending approval", active: "Active", completed: "Completed", archived: "Archived", promoted: "Promoted",
};

export interface PortfolioItem { title: string; description: string; url: string }
export interface InternProfile { intro: string; bio: string; expertise: string[]; capabilities: string[]; contribution: string; role: string }

/** A published profile as the public may see it (from the interns_public view only). */
export interface PublicIntern {
  slug: string; display_name: string; designation: Designation; status: InternStatus; specialty: string; short_bio: string;
  location: string; skills: string[]; specialties: string[]; languages: string[]; tools: string[]; services: string[]; interests: string[];
  portfolio: PortfolioItem[]; external_links: { label: string; url: string }[]; photo_url: string; photo_alt: string;
  profile: InternProfile; seo_title: string; seo_description: string; noindex: boolean; homepage_featured: boolean; homepage_order: number;
  published_at: string | null; updated_at: string;
}
export type InternCard = Pick<PublicIntern, "slug" | "display_name" | "designation" | "specialty" | "short_bio" | "location" | "skills" | "specialties" | "photo_url" | "photo_alt" | "profile">;

export const CARD_FIELDS = "slug,display_name,designation,specialty,short_bio,location,skills,specialties,photo_url,photo_alt,profile";

/** The one-line introduction shown on cards: the admin's short bio, else the profile intro. */
export function cardIntro(i: Pick<PublicIntern, "short_bio" | "profile">): string {
  const t = (i.short_bio || i.profile?.intro || "").replace(/\s+/g, " ").trim();
  return t.length > 160 ? `${t.slice(0, 157).replace(/\s+\S*$/, "")}…` : t;
}

export function photoAlt(i: Pick<PublicIntern, "display_name" | "photo_alt" | "specialty" | "designation">): string {
  return i.photo_alt || `${i.display_name}, ${i.specialty || DESIGNATION[i.designation].label} — ${DESIGNATION[i.designation].label} at EmmaForYou`;
}

export function initials(name: string): string {
  return (name.match(/\p{L}[\p{L}'-]*/gu) ?? []).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "?";
}

export function slugify(t: string): string {
  return t.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70);
}
