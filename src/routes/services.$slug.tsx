import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { KineticText } from "@/components/future/Kinetic";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ExpertiseTemplate from "@/components/ExpertiseTemplate";
import { findExpertise, SERVICE_TO_EXPERTISE, SERVICES } from "@/lib/services-data";
import { pageHead, breadcrumbLd, serviceLd, clip } from "@/lib/seo";

export const Route = createFileRoute("/services/$slug")({
  component: ServicePage,
  loader: ({ params }) => {
    const target = SERVICE_TO_EXPERTISE[params.slug];
    const data = target ? findExpertise(target) : undefined;
    if (!data) throw notFound();
    const name = SERVICES.find((s) => s.slug === params.slug)?.name ?? data.name;
    return { data, slug: params.slug, name };
  },
  head: ({ loaderData }) =>
    loaderData
      ? pageHead({
          title: `${loaderData.name} Services | EmmaForYou`,
          description: clip(`${loaderData.data.hero.sub}`),
          ogDescription: loaderData.data.hero.headline,
          path: `/services/${loaderData.slug}`,
          jsonLd: [
            breadcrumbLd([{ name: "Home", path: "/" }, { name: "Services", path: "/#services" }, { name: loaderData.name, path: `/services/${loaderData.slug}` }]),
            serviceLd({ name: loaderData.name, description: loaderData.data.hero.sub, path: `/services/${loaderData.slug}`, serviceType: loaderData.data.name }),
          ],
        })
      : { meta: [{ title: "Service not found — EmmaForYou" }, { name: "robots", content: "noindex" }] },
  notFoundComponent: () => (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen pt-32 px-5 max-w-3xl mx-auto text-center">
        <h1 className="font-display text-3xl font-bold"><KineticText text="Service not found" base={60} /></h1>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {SERVICES.map(s => <Link key={s.slug} to="/services/$slug" params={{ slug: s.slug }} className="rounded-full border border-border bg-card px-4 py-2 text-sm">{s.icon} {s.name}</Link>)}
        </div>
      </main>
      <Footer />
    </>
  ),
});

function ServicePage() {
  const { data } = Route.useLoaderData();
  return (
    <>
      <Navbar />
      <ExpertiseTemplate data={data} />
      <Footer />
    </>
  );
}
