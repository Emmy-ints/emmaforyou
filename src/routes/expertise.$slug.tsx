import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ExpertiseTemplate from "@/components/ExpertiseTemplate";
import { findExpertise, EXPERTISE } from "@/lib/services-data";
import { pageHead, breadcrumbLd, serviceLd, clip } from "@/lib/seo";
import { canonicalForExpertise } from "@/lib/seo-routes";

export const Route = createFileRoute("/expertise/$slug")({
  component: ExpertisePage,
  loader: ({ params }) => {
    const data = findExpertise(params.slug);
    if (!data) throw notFound();
    return { data };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Expertise not found — EmmaForYou" }, { name: "robots", content: "noindex" }] };
    const d = loaderData.data;
    const own = `/expertise/${d.slug}`;
    const canonical = canonicalForExpertise(d.slug);
    const head = pageHead({
      title: `${d.name} | EmmaForYou`,
      description: clip(d.hero.sub),
      ogDescription: d.hero.headline,
      path: canonical,
      jsonLd: canonical === own
        ? [
            breadcrumbLd([{ name: "Home", path: "/" }, { name: "Expertise", path: "/#services" }, { name: d.name, path: own }]),
            serviceLd({ name: d.name, description: d.hero.sub, path: own }),
          ]
        : [],
    });
    return head;
  },
  notFoundComponent: () => (
    <>
      <Navbar />
      <main className="min-h-screen pt-32 px-5 max-w-3xl mx-auto text-center">
        <h1 className="font-display text-3xl font-bold">Expertise area not found</h1>
        <p className="mt-2 text-muted-foreground">Browse all our expertise areas:</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {EXPERTISE.map(e => <Link key={e.slug} to="/expertise/$slug" params={{ slug: e.slug }} className="rounded-full border border-border bg-card px-4 py-2 text-sm">{e.icon} {e.name}</Link>)}
        </div>
      </main>
      <Footer />
    </>
  ),
});

function ExpertisePage() {
  const { data } = Route.useLoaderData();
  return (
    <>
      <Navbar />
      <ExpertiseTemplate data={data} />
      <Footer />
    </>
  );
}
