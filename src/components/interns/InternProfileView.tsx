import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ExternalLink, Globe2, MapPin } from "lucide-react";
import InternCard, { DesignationBadge, InternPhoto } from "@/components/interns/InternCard";
import { DESIGNATION, type InternCard as Card, type PublicIntern } from "@/lib/interns";
import { EXPERTISE } from "@/lib/services-data";

/** The public profile body. Also used by the admin preview, so a draft looks exactly as it will when published. */
export default function InternProfileView({ i, related = [], preview = false }: { i: PublicIntern; related?: Card[]; preview?: boolean }) {
  const d = DESIGNATION[i.designation];
  const p = i.profile;
  const services = i.services.map((s) => EXPERTISE.find((e) => e.slug === s)).filter(Boolean) as { slug: string; name: string }[];
  const expertise = p.expertise?.length ? p.expertise : i.specialties;
  const bio = (p.bio || "").split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);

  return (
      <>
        <section className="hero-ink hero-x relative overflow-hidden">
          <div className="hero-ink-grid" aria-hidden="true" />
          <div className="hero-ink-glow" aria-hidden="true" />
          <div className="relative mx-auto max-w-6xl px-5 pb-14 pt-32 md:px-8 lg:pt-40">
            <Link to="/interns" className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/70 hover:text-white"><ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />All interns</Link>
            <div className="mt-6 flex flex-col gap-7 md:flex-row md:items-center">
              <InternPhoto i={i} size="lg" eager />
              <div>
                <DesignationBadge d={i.designation} className="itn-badge-lg" />
                {preview ? <p className="hero-ink-title mt-3 !text-[clamp(2rem,1.4rem+2.6vw,3.4rem)]">{i.display_name || "Unnamed draft"}</p> : <h1 className="hero-ink-title mt-3 !text-[clamp(2rem,1.4rem+2.6vw,3.4rem)]">{i.display_name}</h1>}
                <p className="mt-2 text-lg font-medium text-[#c4baff]">{i.specialty}</p>
                <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/75">
                  <span>{d.role}</span>
                  {i.location && <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" aria-hidden="true" />{i.location}</span>}
                  {i.languages.length > 0 && <span className="inline-flex items-center gap-1"><Globe2 className="h-4 w-4" aria-hidden="true" />{i.languages.join(", ")}</span>}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:px-8 lg:grid-cols-[1fr_320px]">
          <article className="space-y-10">
            {(p.intro || i.short_bio) && (
              <section aria-labelledby="itn-intro"><h2 id="itn-intro" className="itn-h2">Introduction</h2><p className="mt-3 text-lg leading-relaxed">{p.intro || i.short_bio}</p></section>
            )}
            {bio.length > 0 && (
              <section aria-labelledby="itn-bio"><h2 id="itn-bio" className="itn-h2">Biography</h2><div className="mt-3 space-y-4 leading-relaxed text-muted-foreground">{bio.map((b, n) => <p key={n}>{b}</p>)}</div></section>
            )}
            {expertise.length > 0 && (
              <section aria-labelledby="itn-exp"><h2 id="itn-exp" className="itn-h2">Specialty &amp; expertise</h2><ul className="mt-3 grid gap-2 sm:grid-cols-2">{expertise.map((x) => <li key={x} className="itn-li">{x}</li>)}</ul></section>
            )}
            {(i.skills.length > 0 || p.capabilities?.length > 0) && (
              <section aria-labelledby="itn-skills">
                <h2 id="itn-skills" className="itn-h2">Skills &amp; capabilities</h2>
                {i.skills.length > 0 && <ul className="mt-3 flex flex-wrap gap-2">{i.skills.map((s) => <li key={s} className="itn-chip">{s}</li>)}</ul>}
                {p.capabilities?.length > 0 && <ul className="mt-4 list-disc space-y-1.5 pl-5 text-muted-foreground">{p.capabilities.map((c) => <li key={c}>{c}</li>)}</ul>}
              </section>
            )}
            {(services.length > 0 || p.contribution) && (
              <section aria-labelledby="itn-svc">
                <h2 id="itn-svc" className="itn-h2">Services they can contribute to</h2>
                {p.contribution && <p className="mt-3 leading-relaxed text-muted-foreground">{p.contribution}</p>}
                {services.length > 0 && <ul className="mt-4 grid gap-2 sm:grid-cols-2">{services.map((s) => (
                  <li key={s.slug}><Link to="/expertise/$slug" params={{ slug: s.slug }} className="itn-svc" data-track="intern_service">{s.name}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></li>
                ))}</ul>}
              </section>
            )}
            {i.tools.length > 0 && (
              <section aria-labelledby="itn-tools"><h2 id="itn-tools" className="itn-h2">Tools &amp; technologies</h2><ul className="mt-3 flex flex-wrap gap-2">{i.tools.map((s) => <li key={s} className="itn-chip">{s}</li>)}</ul></section>
            )}
            {i.portfolio.length > 0 && (
              <section aria-labelledby="itn-port">
                <h2 id="itn-port" className="itn-h2">Approved portfolio</h2>
                <ul className="mt-3 grid gap-3 sm:grid-cols-2">{i.portfolio.map((w) => (
                  <li key={w.title} className="itn-card !p-4">
                    <p className="font-semibold">{w.url ? <a href={w.url} target="_blank" rel="noopener noreferrer nofollow" className="itn-link inline-flex items-center gap-1">{w.title}<ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /></a> : w.title}</p>
                    {w.description && <p className="mt-1 text-sm text-muted-foreground">{w.description}</p>}
                  </li>
                ))}</ul>
              </section>
            )}
            {i.interests.length > 0 && (
              <section aria-labelledby="itn-int"><h2 id="itn-int" className="itn-h2">Professional interests</h2><ul className="mt-3 flex flex-wrap gap-2">{i.interests.map((s) => <li key={s} className="itn-chip">{s}</li>)}</ul></section>
            )}
          </article>

          <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start" aria-label="About this profile">
            <div className="itn-card">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current designation</p>
              <p className="mt-2"><DesignationBadge d={i.designation} /></p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.role || defaultRole(i)}</p>
            </div>
            {i.external_links.length > 0 && (
              <div className="itn-card">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">External portfolio</p>
                <ul className="mt-2 space-y-1.5">{i.external_links.map((l) => <li key={l.url}><a href={l.url} target="_blank" rel="noopener noreferrer nofollow ugc" className="itn-link inline-flex items-center gap-1 text-sm">{l.label}<ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /></a></li>)}</ul>
              </div>
            )}
            <div className="itn-card">
              <p className="font-display text-lg font-semibold">Have a project in mind?</p>
              <p className="mt-1 text-sm text-muted-foreground">Projects are scoped and managed by EmmaForYou.</p>
              <div className="mt-4 flex flex-col gap-2">
                <Link to="/contact" className="btn-gold inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm" data-track="intern_contact">Start a project</Link>
                <Link to="/services" className="nav-ghost h-auto justify-center px-5 py-2.5 text-sm">Explore services</Link>
              </div>
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="border-t border-border py-14" aria-labelledby="itn-more">
            <div className="mx-auto max-w-6xl px-5 md:px-8">
              <div className="flex flex-wrap items-end justify-between gap-3"><h2 id="itn-more" className="itn-h2">More emerging talent</h2><Link to="/interns" className="text-sm font-semibold text-[color:var(--emma-violet)] hover:underline">View all interns</Link></div>
              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{related.map((r) => <InternCard key={r.slug} i={r} compact />)}</div>
            </div>
          </section>
        )}
      </>
  );
}

export function defaultRole(i: PublicIntern) {
  if (i.designation === "team_member") return `${i.display_name} was promoted from intern to Team Member by EmmaForYou and contributes to client projects in ${i.specialty}.`;
  if (i.designation === "alumni") return `${i.display_name} completed an internship with EmmaForYou.`;
  return `${i.display_name} is an intern contributing to EmmaForYou projects in ${i.specialty}. Interns work under the direction of the EmmaForYou team and are not permanent staff.`;
}
