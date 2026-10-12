import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import ProjectCard from "../portfolio/ProjectCard";
import ClientWall from "../portfolio/ClientWall";
import { FEATURED, PROJECTS, findProject, projectSlug } from "@/lib/portfolio-data";

/** Homepage showcase of real client projects. */
export default function SelectedWork() {
  const featured = FEATURED.map((f) => findProject(projectSlug(f.client))).filter((p): p is (typeof PROJECTS)[number] => Boolean(p));
  const rest = PROJECTS.filter((p) => !featured.includes(p)).slice(0, 3);

  return (
    <section id="work" className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-semibold tracking-tight md:text-5xl">Selected client work</h2>
            <p className="mt-4 text-base text-muted-foreground md:text-lg">
              Websites, stores, automation and campaigns we've delivered for {PROJECTS.length} businesses — from a Lagos fashion house to a Maryland real estate team and a clinic in Halle.
            </p>
          </div>
          <Link to="/portfolio" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold transition-colors hover:border-[color:var(--emma-violet)] hover:text-[color:var(--emma-violet)]">
            View all work <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {featured.map((p, i) => <ProjectCard key={p.name} p={p} index={i} />)}
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          {rest.map((p, i) => <ProjectCard key={p.name} p={p} index={i + 3} />)}
        </div>

        <div className="mt-16">
          <p className="mb-4 text-sm text-muted-foreground">Clients we've worked with</p>
          <ClientWall />
        </div>
      </div>
    </section>
  );
}
