import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ExpertiseTemplate from "@/components/ExpertiseTemplate";
import { findExpertise, SERVICE_TO_EXPERTISE, SERVICES } from "@/lib/services-data";

export const Route = createFileRoute("/services/$slug")({
  component: ServicePage,
  loader: ({ params }) => {
    const target = SERVICE_TO_EXPERTISE[params.slug];
    const data = target ? findExpertise(target) : undefined;
    if (!data) throw notFound();
    return { data };
  },
  head: ({ loaderData }) => ({
    meta: loaderData ? [
      { title: `${loaderData.data.name} — EmmaForYou Services` },
      { name: "description", content: loaderData.data.hero.sub },
    ] : [{ title: "Services — EmmaForYou" }],
  }),
  notFoundComponent: () => (
    <>
      <Navbar />
      <main className="min-h-screen pt-32 px-5 max-w-3xl mx-auto text-center">
        <h1 className="font-display text-3xl font-bold">Service not found</h1>
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
