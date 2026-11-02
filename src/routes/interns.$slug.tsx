import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { KineticText } from "@/components/future/Kinetic";
import InternProfileView from "@/components/interns/InternProfileView";
import { getIntern } from "@/lib/interns-server";
import { DESIGNATION, cardIntro, photoAlt, type InternCard as InternCardT, type PublicIntern } from "@/lib/interns";
import { SITE_NAME, SITE_URL, absoluteUrl, breadcrumbLd, clip, pageHead, withBrand } from "@/lib/seo";

export const Route = createFileRoute("/interns/$slug")({
  component: InternPage,
  loader: async ({ params }) => {
    const found = await getIntern({ data: params.slug });
    if (!found) throw notFound();
    if ("redirect" in found) throw redirect({ to: "/interns/$slug", params: { slug: found.redirect }, statusCode: 301 });
    return found;
  },
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main id="main-content" className="pt-40 pb-24 text-center">
        <h1 className="font-display text-3xl font-bold"><KineticText text="Profile not found" base={60} /></h1>
        <p className="mt-3 text-muted-foreground">This profile isn't public, or the link has changed.</p>
        <Link to="/interns" className="mt-5 inline-block text-sm underline">See all interns</Link>
      </main>
      <Footer />
    </div>
  ),
  head: ({ loaderData }) => {
    if (!loaderData || !("intern" in loaderData)) return { meta: [{ title: "Profile not found — EmmaForYou" }, { name: "robots", content: "noindex" }] };
    const i = loaderData.intern;
    const d = DESIGNATION[i.designation];
    const path = `/interns/${i.slug}`;
    return pageHead({
      title: i.seo_title || withBrand(trimWords(`${i.display_name} — ${d.label}, ${i.specialty}`, 60)),
      description: i.seo_description || clip(`${i.display_name} is ${d.label === "Intern" ? "an intern" : `a ${d.label.toLowerCase()}`} at EmmaForYou specialising in ${i.specialty}. ${cardIntro(i)}`, 158),
      path,
      type: "profile",
      image: i.photo_url || undefined,
      imageAlt: photoAlt(i),
      noindex: i.noindex,
      jsonLd: [
        breadcrumbLd([{ name: "Home", path: "/" }, { name: "Interns", path: "/interns" }, { name: i.display_name, path }]),
        personLd(i, path),
      ],
    });
  },
});

/** Cut at a word boundary (never mid-word) and drop dangling joiners. */
function trimWords(t: string, max: number) {
  if (t.length <= max) return t;
  return t.slice(0, max + 1).replace(/\s+\S*$/, "").replace(/[\s,—–-]+(and|or|&|for|of|the)?$/i, "").trim();
}

/** ProfilePage + Person: only facts on the page; "affiliation" (not worksFor) because interns aren't employees. */
function personLd(i: PublicIntern, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${absoluteUrl(path)}#page`,
    url: absoluteUrl(path),
    dateModified: i.updated_at,
    mainEntity: {
      "@type": "Person",
      name: i.display_name,
      jobTitle: `${DESIGNATION[i.designation].label} — ${i.specialty}`,
      description: cardIntro(i),
      ...(i.photo_url ? { image: absoluteUrl(i.photo_url) } : {}),
      affiliation: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
      ...(i.skills.length ? { knowsAbout: i.skills } : {}),
      ...(i.languages.length ? { knowsLanguage: i.languages } : {}),
      ...(i.location ? { homeLocation: { "@type": "Place", name: i.location } } : {}),
    },
  };
}

function InternPage() {
  const { intern, related } = Route.useLoaderData() as { intern: PublicIntern; related: InternCardT[] };
  return (
    <div className="bg-background text-foreground">
      <Navbar />
      <main id="main-content"><InternProfileView i={intern} related={related} /></main>
      <Footer />
    </div>
  );
}
