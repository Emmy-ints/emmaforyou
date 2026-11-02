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

/** Freelance marketplaces and profile sites an admin can link. Hosts mirror intern_link_valid() in the database. */
export const PLATFORMS: { id: string; name: string; hosts: string[] | null; example: string }[] = [
  { id: "fiverr", name: "Fiverr", hosts: ["fiverr.com"], example: "https://www.fiverr.com/username" },
  { id: "upwork", name: "Upwork", hosts: ["upwork.com"], example: "https://www.upwork.com/freelancers/~…" },
  { id: "freelancer", name: "Freelancer", hosts: ["freelancer."], example: "https://www.freelancer.com/u/username" },
  { id: "linkedin", name: "LinkedIn", hosts: ["linkedin.com"], example: "https://www.linkedin.com/in/username" },
  { id: "behance", name: "Behance", hosts: ["behance.net"], example: "https://www.behance.net/username" },
  { id: "dribbble", name: "Dribbble", hosts: ["dribbble.com"], example: "https://dribbble.com/username" },
  { id: "github", name: "GitHub", hosts: ["github.com"], example: "https://github.com/username" },
  { id: "peopleperhour", name: "PeoplePerHour", hosts: ["peopleperhour.com"], example: "https://www.peopleperhour.com/freelancer/…" },
  { id: "toptal", name: "Toptal", hosts: ["toptal.com"], example: "https://www.toptal.com/resume/…" },
  { id: "contra", name: "Contra", hosts: ["contra.com"], example: "https://contra.com/username" },
  { id: "portfolio", name: "Portfolio website", hosts: null, example: "https://their-portfolio.com" },
  { id: "other", name: "Other profile", hosts: null, example: "https://…" },
];
export const platformName = (id: string) => PLATFORMS.find((p) => p.id === id)?.name ?? "Profile";
/** The button text: the admin's label, else "View <Platform> Profile". */
export const linkLabel = (l: { platform?: string; label?: string; button_label?: string }) =>
  (l.button_label || l.label || "").trim() || (l.platform === "portfolio" ? "View Portfolio" : l.platform === "other" || !l.platform ? "View Profile" : `View ${platformName(l.platform)} Profile`);

/** Same rules as the database check: https, on the platform's own site, no email addresses. */
export function linkProblem(platform: string, url: string): string | null {
  const u = url.trim();
  if (!u) return "Add the profile URL.";
  if (!/^https:\/\/[A-Za-z0-9.-]+\.[A-Za-z]{2,}(:[0-9]{2,5})?(\/[^\s<>"']*)?$/.test(u)) return "Use a full https:// link.";
  if (/mailto:|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/i.test(u)) return "Links can't contain an email address.";
  const p = PLATFORMS.find((x) => x.id === platform);
  if (!p) return "Choose a platform.";
  if (p.hosts) {
    const host = new URL(u).hostname.toLowerCase();
    const ok = p.hosts.some((h) => (h.endsWith(".") ? host.replace(/^([a-z0-9-]+\.)?/, "").startsWith(h) || host.startsWith(h) : host === h || host.endsWith(`.${h}`)));
    if (!ok) return `This isn't a ${p.name} link (${p.hosts[0].replace(/\.$/, "")}).`;
  }
  return null;
}

export interface FreelanceLink { platform: string; label: string; url: string }
export interface LanguageDetail { language: string; details: string }

export interface PortfolioItem { title: string; description: string; url: string }
export interface InternProfile { intro: string; bio: string; expertise: string[]; capabilities: string[]; contribution: string; role: string }

/** A published profile as the public may see it (from the interns_public view only). */
export interface PublicIntern {
  slug: string; display_name: string; username: string; designation: Designation; status: InternStatus; specialty: string; short_bio: string;
  location: string; skills: string[]; specialties: string[]; languages: string[]; tools: string[]; services: string[]; interests: string[];
  portfolio: PortfolioItem[]; external_links: { label: string; url: string }[]; photo_url: string; photo_alt: string;
  profile: InternProfile; seo_title: string; seo_description: string; noindex: boolean; homepage_featured: boolean; homepage_order: number;
  published_at: string | null; updated_at: string;
  language_details?: LanguageDetail[]; freelance_links?: FreelanceLink[];
}
export type InternCard = Pick<PublicIntern, "slug" | "display_name" | "username" | "languages" | "designation" | "specialty" | "short_bio" | "location" | "skills" | "specialties" | "photo_url" | "photo_alt" | "profile" | "freelance_links">;

export const CARD_FIELDS = "slug,display_name,username,languages,designation,specialty,short_bio,location,skills,specialties,photo_url,photo_alt,profile,freelance_links";

/** The one-line introduction shown on cards: the admin's short bio, else the profile intro. */
export function cardIntro(i: Pick<PublicIntern, "short_bio" | "profile">): string {
  const t = (i.short_bio || i.profile?.intro || "").replace(/\s+/g, " ").trim();
  return t.length > 160 ? `${t.slice(0, 157).replace(/\s+\S*$/, "")}…` : t;
}

export function photoAlt(i: Pick<PublicIntern, "display_name" | "photo_alt" | "specialty" | "designation"> & { username?: string }): string {
  return i.photo_alt || `${i.display_name || (i.username ? `@${i.username}` : "Intern")}, ${i.specialty || DESIGNATION[i.designation].label} — ${DESIGNATION[i.designation].label} at EmmaForYou`;
}

export function initials(name: string): string {
  return (name.match(/\p{L}[\p{L}'-]*/gu) ?? []).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "?";
}

export function slugify(t: string): string {
  return t.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70);
}
