import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { KineticText } from "@/components/future/Kinetic";
import InternCard from "@/components/interns/InternCard";
import { listInterns } from "@/lib/interns-server";
import { pageHead, breadcrumbLd, itemListLd } from "@/lib/seo";

const ORDER = { intern: 0, team_member: 1, alumni: 2 } as const;

export const Route = createFileRoute("/interns/")({
  component: InternsPage,
  loader: async () => (await listInterns()).sort((a, b) => ORDER[a.designation] - ORDER[b.designation]),
  head: ({ loaderData }) =>
    pageHead({
      title: "Interns & Emerging Talent | EmmaForYou",
      description: "Meet the interns contributing to EmmaForYou projects — their specialties, skills, languages and approved portfolio work. Interns are clearly labelled and are not permanent staff.",
      path: "/interns",
      noindex: !loaderData?.length,
      jsonLd: [
        breadcrumbLd([{ name: "Home", path: "/" }, { name: "Interns", path: "/interns" }]),
        ...(loaderData?.length ? [itemListLd("EmmaForYou interns", loaderData.map((i) => ({ name: i.display_name, path: `/interns/${i.slug}` })))] : []),
      ],
    }),
});

function InternsPage() {
  const all = Route.useLoaderData();
  const [q, setQ] = useState("");
  const [spec, setSpec] = useState("");
  const [skill, setSkill] = useState("");
  const [loc, setLoc] = useState("");
  const opts = useMemo(() => {
    const uniq = (xs: string[]) => Array.from(new Set(xs.filter(Boolean).map((x) => x.trim()))).sort((a, b) => a.localeCompare(b));
    return { specs: uniq(all.flatMap((i) => i.specialties.length ? i.specialties : [i.specialty])), skills: uniq(all.flatMap((i) => i.skills)), locs: uniq(all.map((i) => i.location)) };
  }, [all]);
  const shown = all.filter((i) => {
    const hay = `${i.display_name} ${i.username} ${i.specialty} ${i.specialties.join(" ")} ${i.skills.join(" ")} ${i.location} ${i.languages.join(" ")} ${i.short_bio}`.toLowerCase();
    return (!q || q.toLowerCase().split(/\s+/).every((w) => hay.includes(w)))
      && (!spec || i.specialty === spec || i.specialties.includes(spec))
      && (!skill || i.skills.includes(skill))
      && (!loc || i.location === loc);
  });
  const filtered = q || spec || skill || loc;
  const sel = "itn-select";

  return (
    <div className="bg-background text-foreground">
      <Navbar />
      <main id="main-content">
        <section className="hero-ink hero-x relative overflow-hidden">
          <div className="hero-ink-grid" aria-hidden="true" />
          <div className="hero-ink-glow" aria-hidden="true" />
          <div className="relative mx-auto max-w-7xl px-5 pb-14 pt-32 md:px-8 lg:pt-40">
            <p className="hero-kicker"><span className="hero-kicker-dot" aria-hidden="true" />Our emerging talent</p>
            <h1 className="hero-ink-title max-w-[20ch]"><KineticText text="Meet the interns contributing to EmmaForYou" shine={["interns"]} /></h1>
            <p className="hero-ink-sub max-w-2xl">
              Specialists early in their journey who contribute to EmmaForYou projects under our team's direction. Every intern is clearly labelled with an <strong>INTERN</strong> badge — interns are not employees or permanent staff.
            </p>
          </div>
        </section>

        <section className="py-14 md:py-20" aria-labelledby="itn-dir-h">
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <h2 id="itn-dir-h" className="sr-only">Intern directory</h2>
            {all.length > 0 && (
              <form role="search" className="itn-filters" onSubmit={(e) => e.preventDefault()}>
                <label className="itn-search">
                  <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <span className="sr-only">Search interns</span>
                  <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, @username, skill or language" className="w-full bg-transparent outline-none" />
                </label>
                <label><span className="sr-only">Specialty</span><select className={sel} value={spec} onChange={(e) => setSpec(e.target.value)}><option value="">All specialties</option>{opts.specs.map((s) => <option key={s}>{s}</option>)}</select></label>
                <label><span className="sr-only">Skill</span><select className={sel} value={skill} onChange={(e) => setSkill(e.target.value)}><option value="">All skills</option>{opts.skills.map((s) => <option key={s}>{s}</option>)}</select></label>
                <label><span className="sr-only">Location</span><select className={sel} value={loc} onChange={(e) => setLoc(e.target.value)}><option value="">All locations</option>{opts.locs.map((s) => <option key={s}>{s}</option>)}</select></label>
                {filtered && <button type="button" className="nav-ghost h-auto px-4 py-2 text-sm" onClick={() => { setQ(""); setSpec(""); setSkill(""); setLoc(""); }}>Clear</button>}
              </form>
            )}
            <p className="mt-5 text-sm text-muted-foreground" aria-live="polite">{all.length ? `${shown.length} of ${all.length} profile${all.length === 1 ? "" : "s"}` : ""}</p>
            {shown.length > 0 ? (
              <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{shown.map((i) => <InternCard key={i.slug} i={i} />)}</div>
            ) : (
              <div className="itn-empty">
                <Users className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
                <p className="mt-3 font-medium">{all.length ? "No interns match those filters." : "Intern profiles are on their way."}</p>
                <p className="mt-1 text-sm text-muted-foreground">{all.length ? "Try a different skill or clear the filters." : "Our new intern profiles will appear here once they're approved."}</p>
              </div>
            )}
            <div className="itn-note mt-14">
              <h2 className="font-display text-xl font-semibold">Working with EmmaForYou</h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">Client projects are scoped, managed and quality-checked by EmmaForYou. Interns contribute to the services they're listed for. To start a project, talk to us rather than contacting an intern directly.</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link to="/contact" className="btn-gold inline-flex items-center gap-2 rounded-full px-6 py-3 text-[15px]" data-track="interns_contact">Start a project</Link>
                <Link to="/services" className="nav-ghost h-auto px-6 py-3">Explore our services</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
