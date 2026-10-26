import { Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck } from "lucide-react";
import ProjectCard from "../portfolio/ProjectCard";
import ClientWall from "../portfolio/ClientWall";
import SectionHead from "../future/SectionHead";
import { useSettings } from "@/lib/site-settings";
import { liveProjects } from "@/lib/portfolio-live";
import { FEATURED, PROJECTS, findProject, projectSlug } from "@/lib/portfolio-data";

/**
 * Homepage showcase of real client projects (the owner's records in portfolio-data, unchanged):
 * a cinematic bento with the lead project large, the next two stacked beside it, then three more.
 * Photos drift inside their frames as the page scrolls; stock photos are labelled on the card.
 */
export default function SelectedWork() {
  const featured = FEATURED.map((f) => findProject(projectSlug(f.client))).filter((p): p is (typeof PROJECTS)[number] => Boolean(p));
  const settings = useSettings();
  const rest = liveProjects(settings).filter((p) => !featured.includes(p)).slice(0, 3);

  return (
    <section id="work" className="sw relative overflow-hidden py-24 md:py-32">
      <div className="sw-light" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-5 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHead
            kicker={<><BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />Real client projects</>}
            title="Selected client work"
            sub={<>Websites, stores, automation and campaigns we've delivered for {PROJECTS.length} businesses — from a Lagos fashion house to a Maryland real estate team and a clinic in Halle.</>}
          />
          <Link to="/portfolio" className="sw-all" data-magnetic>
            View all work <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <ul className="grid sw-bento mt-12">
          {featured.map((p, i) => <li key={p.name} className={i === 0 ? "sw-lead" : ""}><ProjectCard p={p} index={i} size={i === 0 ? "lg" : "md"} /></li>)}
          {rest.map((p, i) => <li key={p.name}><ProjectCard p={p} index={i + 3} /></li>)}
        </ul>

        <div className="mt-16">
          <p className="mb-4 text-sm text-muted-foreground">Clients we've worked with</p>
          <ClientWall />
        </div>
      </div>
    </section>
  );
}
