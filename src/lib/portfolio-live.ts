import { PROJECTS, featuredFor, projectSlug, type Project } from "./portfolio-data";

/**
 * The owner's portfolio records stay verbatim in portfolio-data.ts. From the control room the
 * owner can hide a project, change its order, or replace its stand-in photo with a real
 * screenshot (uploaded to the media library); text is never rewritten here.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type S = Record<string, any>;
export const projectOverride = (p: Project, s: S) => s[`project:${projectSlug(p.name)}`] as { hidden?: boolean; order?: number; img?: string; screenshot?: boolean } | undefined;
export function liveProjects(s: S): Project[] {
  return PROJECTS.map((p, i) => ({ p, o: projectOverride(p, s), i }))
    .filter((x) => !x.o?.hidden)
    .sort((a, b) => (a.o?.order ?? 500 + a.i) - (b.o?.order ?? 500 + b.i))
    .map((x) => x.p);
}
export function liveImage(p: Project, s: S): string { return projectOverride(p, s)?.img || featuredFor(p.name)?.img || p.img; }
/** A stock photo stands in unless the project has its own featured asset or the owner supplied a real screenshot. */
export function liveStandIn(p: Project, s: S): boolean { const o = projectOverride(p, s); return !(featuredFor(p.name) || (o?.img && o.screenshot)); }
